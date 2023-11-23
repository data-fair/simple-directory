const config = require('config')
const express = require('express')
const URL = require('url').URL
const emailValidator = require('email-validator')
const bodyParser = require('body-parser')
const requestIp = require('request-ip')
const shortid = require('shortid')
const Cookies = require('cookies')
const slug = require('slugify')
const tokens = require('../utils/tokens')
const asyncWrap = require('../utils/async-wrap')
const mails = require('../mails')
const passwords = require('../utils/passwords')
const webhooks = require('../webhooks')
const oauth = require('../utils/oauth')
const saml2 = require('../utils/saml2')
const userName = require('../utils/user-name')
const twoFA = require('./2fa.js')
const limiter = require('../utils/limiter')
const storages = require('../storages')
const defaultConfig = require('../../config/default.js')
const { unshortenInvit } = require('../utils/invitations')
const { send: sendNotification } = require('../utils/notifications')
const limits = require('../utils/limits')
const debug = require('debug')('auth')

const router = exports.router = express.Router()

// these routes accept url encoded form data so that they can be used from basic
// html forms
router.use(bodyParser.urlencoded({ limit: '100kb' }))

async function confirmLog (storage, user) {
  if (!storage.readonly) {
    await storage.updateLogged(user.id)
    if (user.emailConfirmed === false) {
      await storage.confirmEmail(user.id)
      webhooks.postIdentity('user', user)
    }
  }
}

// Authenticate a user based on his email address and password
router.post('/password', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  if (!req.body.password) return res.status(400).send(req.messages.errors.badCredentials)

  const returnError = async (error, errorCode) => {
    debug('auth password return error', error, errorCode)
    // prevent attacker from analyzing response time
    await new Promise(resolve => setTimeout(resolve, Math.round(Math.random * 1000)))
    if (req.is('application/x-www-form-urlencoded')) {
      const refererUrl = new URL(req.headers.referer || req.headers.referrer)
      refererUrl.searchParams.set('error', error)
      res.redirect(refererUrl.href)
    } else {
      res.status(errorCode).send(req.messages.errors[error] || error)
    }
  }

  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
    await limiter(req).consume(req.body.email, 1)
  } catch (err) {
    console.error('Rate limit error for /password route', requestIp.getClientIp(req), req.body.email, err)
    return returnError('rateLimitAuth', 429)
  }

  const orgId = req.body.org || req.query.org
  const depId = req.body.dep || req.query.dep
  let org, dep
  if (orgId && typeof orgId === 'string') {
    org = await req.app.get('storage').getOrganization(orgId)
    if (!org) return returnError('badCredentials', 400)
    if (depId) {
      dep = org.departments.find(d => d.id === depId)
      if (!dep) return returnError('badCredentials', 400)
    }
  }

  let storage = req.app.get('storage')
  if (req.body.orgStorage && org.orgStorage && org.orgStorage.active && config.perOrgStorageTypes.includes(org.orgStorage.type)) {
    storage = await storages.init(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }

  if (config.adminCredentials?.password?.hash && config.adminCredentials.email === req.body.email) {
    const validPassword = await passwords.checkPassword(req.body.password, config.adminCredentials.password)
    if (validPassword) {
      const payload = tokens.getPayload({ id: '_superadmin', name: 'Super Admin', email: req.body.email })
      payload.adminMode = true
      const callbackUrl = tokens.prepareCallbackUrl(req, payload, req.query.redirect).href
      debug('Password based authentication of superadmin with password from config', callbackUrl)
      return res.send(callbackUrl)
    } else {
      return returnError('badCredentials', 400)
    }
  }

  let user = await storage.getUserByEmail(req.body.email, req.site)
  let userFromMainHost = false
  if (!user || user.emailConfirmed === false) {
    if (req.site) {
      user = await storage.getUserByEmail(req.body.email)
      userFromMainHost = true
    }
    if (!user) return returnError('badCredentials', 400)
  }
  if (storage.getPassword) {
    const storedPassword = await storage.getPassword(user.id)
    const validPassword = await passwords.checkPassword(req.body.password, storedPassword)
    if (!validPassword) return returnError('badCredentials', 400)
  } else {
    if (!await storage.checkPassword(user.id, req.body.password)) {
      return returnError('badCredentials', 400)
    }
  }
  if (org && req.body.membersOnly && !user.organizations.find(o => o.id === org.id)) {
    return returnError('badCredentials', 400)
  }

  if (userFromMainHost) {
    const payload = {
      id: user.id,
      email: user.email,
      action: 'changeHost'
    }
    const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
    const changeHostUrl = new URL((req.site.host.startsWith('localhost') ? 'http://' : 'https://') + req.site.host + '/simple-directory/login')
    changeHostUrl.searchParams.set('action_token', token)
    if (req.is('application/x-www-form-urlencoded')) {
      return res.redirect(changeHostUrl.href)
    } else {
      return res.send(changeHostUrl.href)
    }
  }

  const payload = tokens.getPayload(user)
  if (req.body.adminMode) {
    if (payload.isAdmin) payload.adminMode = true
    else return returnError('adminModeOnly', 403)
  } else if (req.body.rememberMe) {
    payload.rememberMe = true
  }
  // 2FA management
  const user2FA = await storage.get2FA(user.id)
  if ((user2FA && user2FA.active) || await storage.required2FA(payload)) {
    if (await twoFA.checkSession(req, user.id)) {
      // 2FA was already validated earlier and present in a cookie
    } else if (req.body['2fa']) {
      if (!await twoFA.isValid(user2FA, req.body['2fa'].trim())) {
        // a token was sent but it is not an actual 2FA token, instead it is the special recovery token
        if (user2FA) {
          const validRecovery = await passwords.checkPassword(req.body['2fa'].trim(), user2FA.recovery)
          if (validRecovery) {
            await req.app.get('storage').patchUser(user.id, { '2FA': { active: false } })
            return returnError('2fa-missing', 403)
          }
        }
        return returnError('2fa-bad-token', 403)
      } else {
        // 2FA token sent alongside email/password
        const cookies = new Cookies(req, res)
        const token = tokens.sign(req.app.get('keys'), { user: user.id }, config.jwtDurations['2FAToken'])
        cookies.set(twoFA.cookieName(user.id), token, { expires: new Date(tokens.decode(token).exp * 1000), sameSite: 'lax', httpOnly: true })
      }
    } else {
      if (!user2FA || !user2FA.active) {
        return returnError('2fa-missing', 403)
      } else {
        return returnError('2fa-required', 403)
      }
    }
  }

  // this is used by data-fair app integrated login
  if (req.is('application/x-www-form-urlencoded')) {
    const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
    tokens.setCookieToken(req, res, token, tokens.getDefaultUserOrg(user, orgId, depId))
    debug(`Password based authentication of user ${user.name}, form mode`)
    res.redirect(req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl + '/me')
  } else {
    const callbackUrl = tokens.prepareCallbackUrl(req, payload, req.query.redirect, tokens.getDefaultUserOrg(user, orgId, depId), req.body.orgStorage).href
    debug(`Password based authentication of user ${user.name}, ajax mode`, callbackUrl)
    res.send(callbackUrl)
  }
}))

// Either find or create an user based on an email address then send a mail with a link and a token
// to check that this address belongs to the user.
router.post('/passwordless', asyncWrap(async (req, res, next) => {
  if (!config.passwordless) return res.status(400).send(req.messages.errors.noPasswordless)
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)

  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /passwordless route', requestIp.getClientIp(req), req.body.email, err)
    return res.status(429).send(req.messages.errors.rateLimitAuth)
  }

  let org
  if (req.body.org) {
    org = await req.app.get('storage').getOrganization(req.body.org)
    if (!org) return res.status(404).send(req.messages.errors.orgaUnknown)
  }

  let storage = req.app.get('storage')
  if (req.body.orgStorage && org.orgStorage && org.orgStorage.active && config.perOrgStorageTypes.includes(org.orgStorage.type)) {
    storage = await storages.init(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }
  const user = await storage.getUserByEmail(req.body.email, req.site)

  const redirect = req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl
  const redirectUrl = new URL(redirect)

  // No 404 here so we don't disclose information about existence of the user
  if (!user || user.emailConfirmed === false) {
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'noCreation',
      messages: req.messages,
      to: req.body.email,
      params: { link: redirect, host: redirectUrl.host, origin: redirectUrl.origin }
    })
    return res.status(204).send()
  }

  if (org && req.body.membersOnly === 'true' && !user.organizations.find(o => o.id === org.id)) {
    if (!org) return res.status(404).send(req.messages.errors.orgaUnknown)
  }

  const payload = tokens.getPayload(user)
  if (req.body.rememberMe) payload.rememberMe = true
  payload.temporary = true

  // passwordless is not compatible with 2FA for now
  if (await storage.get2FA(user.id) || await storage.required2FA(payload)) {
    return res.status(400).send(req.messages.errors.passwordless2FA)
  }

  const linkUrl = tokens.prepareCallbackUrl(req, payload, req.query.redirect, tokens.getDefaultUserOrg(user, req.body.org, req.body.dep), req.body.orgStorage)
  debug(`Passwordless authentication of user ${user.name}`)
  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'login',
    messages: req.messages,
    to: user.email,
    params: { link: linkUrl.href, host: linkUrl.host, origin: linkUrl.origin }
  })
  res.status(204).send()
}))

// use current session and redirect to a secondary site
router.post('/site_redirect', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(403).send()
  if (req.site) return res.status(400).send()
  const storage = req.app.get('storage')
  const user = await storage.getUserByEmail(req.user.email)
  if (!user) return res.status(404).send('user not found')
  if (!req.body.redirect) return res.status(400).send()
  const site = await storage.getSiteByHost(new URL(req.body.redirect).host)
  if (!user) return res.status(404).send('site not found')
  const payload = tokens.getPayload(user)
  const callbackUrl = tokens.prepareCallbackUrl(req, payload, req.body.redirect, tokens.getDefaultUserOrg(user, req.body.org, req.body.dep)).href
  debug(`Redirect auth of user ${user.name} to site ${site.host}`, callbackUrl)
  res.send(callbackUrl)
}))

router.get('/token_callback', asyncWrap(async (req, res, next) => {
  const redirectError = (error, withIdToken) => res.redirect(`${req.publicBaseUrl}/login?error=${encodeURIComponent(error)}`)

  if (!req.query.id_token) return redirectError('missingToken')
  let decoded
  try {
    decoded = await tokens.verify(req.app.get('keys'), req.query.id_token)
  } catch (err) {
    return redirectError('invalidToken')
  }

  let org
  if (req.query.id_token_org) {
    org = await req.app.get('storage').getOrganization(req.query.id_token_org)
    if (!org) return redirectError('orgaUnknown')
  }
  let storage = req.app.get('storage')
  if (req.query.org_storage === 'true' && org.orgStorage && org.orgStorage.active && config.perOrgStorageTypes.includes(org.orgStorage.type)) {
    storage = await storages.init(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }
  const user = decoded.id === '_superadmin' ? decoded : await storage.getUser({ id: decoded.id })

  if (!user || (decoded.emailConfirmed !== true && user.emailConfirmed === false)) {
    return redirectError('badCredentials')
  }

  const reboundRedirect = req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl + '/me'

  const payload = tokens.getPayload(user)
  if (decoded.rememberMe) payload.rememberMe = true
  if (decoded.adminMode && payload.isAdmin) payload.adminMode = true
  const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)

  await confirmLog(storage, user)
  tokens.setCookieToken(req, res, token, tokens.getDefaultUserOrg(user, req.query.id_token_org, req.query.id_token_dep))

  // we just confirmed the user email after creation, he might want to create an organization
  if (decoded.emailConfirmed && config.quotas.defaultMaxCreatedOrgs !== 0 && !org && !reboundRedirect.startsWith(`${req.publicBaseUrl}/login`)) {
    const redirectUrl = new URL(`${req.publicBaseUrl}/login`)
    redirectUrl.searchParams.set('step', 'createOrga')
    redirectUrl.searchParams.set('redirect', reboundRedirect)
    debug('redirect to createOrga step', redirectUrl.href)
    res.redirect(redirectUrl.href)
  } else if (user.plannedDeletion) {
    const redirectUrl = new URL(`${req.publicBaseUrl}/login`)
    redirectUrl.searchParams.set('step', 'plannedDeletion')
    redirectUrl.searchParams.set('redirect', reboundRedirect)
    debug('redirect to plannedDeletion step', redirectUrl.href)
    res.redirect(redirectUrl.href)
  } else {
    res.redirect(reboundRedirect)
  }
}))

// Used to extend an older but still valid token from a user
// TODO: deprecate this whole route, replaced by simpler /keepalive
router.post('/exchange', asyncWrap(async (req, res, next) => {
  const idToken = (req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop()) || req.query.id_token
  if (!idToken) {
    return res.status(401).send('No id_token cookie provided')
  }
  let decoded
  try {
    decoded = await tokens.verify(req.app.get('keys'), idToken)
  } catch (err) {
    return res.status(401).send('Invalid id_token')
  }

  // User may have new organizations since last renew
  const storage = req.app.get('storage')
  const user = decoded.id === '_superadmin' ? decoded : await storage.getUser({ id: decoded.id })

  if (!user) return res.status(401).send('User does not exist anymore')
  const payload = tokens.getPayload(user)
  if (decoded.adminMode && req.query.noAdmin !== 'true') payload.adminMode = true
  if (decoded.asAdmin) {
    payload.asAdmin = decoded.asAdmin
    payload.name = decoded.name
    payload.isAdmin = false
  } else {
    if (!storage.readonly) {
      await storage.updateLogged(decoded.id)
      if (user.emailConfirmed === false) {
        await storage.confirmEmail(decoded.id)
        webhooks.postIdentity('user', user)
      }
    }
  }
  if (decoded.rememberMe) payload.rememberMe = true
  const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
  debug(`Exchange session token for user ${user.name}`)

  // TODO: sending token in response is deprecated and will be removed ?
  res.set('Deprecation', 'true')
  res.send(token)
}))

router.post('/keepalive', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send('No active session to keep alive')
  debug(`Exchange session token for user ${req.user.name}`)
  await tokens.keepalive(req, res)
  res.status(204).send()
}))

router.delete('/', (req, res) => {
  tokens.unsetCookies(req, res)
  res.status(204).send()
})

// Send an email to confirm user identity before authorizing an action
router.post('/action', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  if (!req.body.action) return res.status(400).send(req.messages.errors.badCredentials)

  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /action route', requestIp.getClientIp(req), req.body.email, err)
    return res.status(429).send(req.messages.errors.rateLimitAuth)
  }

  const storage = req.app.get('storage')
  let user = await storage.getUserByEmail(req.body.email, req.site)
  let action = req.body.action
  if (!user && req.site) {
    user = await storage.getUserByEmail(req.body.email)
    action = 'changeHost'
  }
  // No 404 here so we don't disclose information about existence of the user
  if (!user || user.emailConfirmed === false) {
    const link = req.body.target || config.defaultLoginRedirect || (req.publicBaseUrl + '/login')
    const linkUrl = new URL(link)
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'noCreation',
      messages: req.messages,
      to: req.body.email,
      params: { link, host: linkUrl.host, origin: linkUrl.origin }
    })
    return res.status(204).send()
  }
  const payload = {
    id: user.id,
    email: user.email,
    action
  }
  const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
  const linkUrl = new URL(req.body.target || req.publicBaseUrl + '/login')
  linkUrl.searchParams.set('action_token', token)

  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'action',
    messages: req.messages,
    to: user.email,
    params: { link: linkUrl.href, host: linkUrl.host, origin: linkUrl.origin }
  })
  res.status(204).send()
}))

router.delete('/adminmode', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send('No active session')
  if (!req.user.adminMode) return res.status(403).send('This route is only available in admin mode')
  debug(`Exchange session token without adminMode for user ${req.user.name}`)
  req.query.noAdmin = 'true'
  await tokens.keepalive(req, res)
  res.status(204).send()
}))

// create a session has a user but from a super admin session
router.post('/asadmin', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send('No active session to keep alive')
  if (!req.user.isAdmin) return res.status(403).send('This functionality is for admins only')
  const storage = req.app.get('storage')
  const user = await storage.getUser({ id: req.body.id })
  if (!user) return res.status(404).send('User does not exist')
  const payload = tokens.getPayload(user)
  payload.name += ' (administration)'
  payload.asAdmin = { id: req.user.id, name: req.user.name }
  payload.isAdmin = false
  const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
  debug(`Exchange session token for user ${user.name} from an admin session`)
  tokens.setCookieToken(req, res, token, tokens.getDefaultUserOrg(user))

  res.status(204).send()
}))

router.delete('/asadmin', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send('No active session to keep alive')
  if (!req.user.asAdmin) return res.status(403).send('This functionality is for admins only')
  const storage = req.app.get('storage')
  const user = req.user.asAdmin.id === '_superadmin' ? req.user.asAdmin : await storage.getUser({ id: req.user.asAdmin.id })
  if (!user) return res.status(401).send('User does not exist anymore')
  const payload = tokens.getPayload(user)
  payload.adminMode = true
  const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
  debug(`Exchange session token for user ${user.name} from an asAdmin session`)
  tokens.setCookieToken(req, res, token, tokens.getDefaultUserOrg(user))

  res.status(204).send()
}))

router.get('/me', (req, res) => {
  if (!req.user) return res.status(404).send()
  else res.send(req.user)
})

router.get('/providers', asyncWrap(async (req, res) => {
  if (!req.site) {
    res.send(saml2.publicProviders.concat(oauth.publicProviders))
  } else {
    const providers = req.site.authProviders || []
    const providersInfos = []
    for (const p of providers) {
      if (p.type === 'oidc') {
        providersInfos.push({
          type: p.type,
          id: oauth.getProviderId(p.discovery),
          title: p.title,
          color: p.color,
          img: p.img,
          redirectMode: p.redirectMode
        })
      }
      if (p.type === 'otherSite') {
        const site = await req.app.get('storage').getSiteByHost(p.site)
        if (site && site.owner.type === req.site.owner.type && site.owner.id === req.site.owner.id) {
          providersInfos.push({ type: 'otherSite', id: slug(site.host, { lower: true, strict: true }), title: p.title, color: site.theme?.primaryColor, img: site.logo, host: site.host })
        }
      }
    }
    res.send(providersInfos)
  }
}))

// OAUTH
const debugOAuth = require('debug')('oauth')

const oauthLogin = asyncWrap(async (req, res, next) => {
  let provider
  if (!req.site) {
    provider = oauth.providers.find(p => p.id === req.params.oauthId)
  } else {
    const providerInfo = req.site.authProviders.find(p => oauth.getProviderId(p.discovery) === req.params.oauthId)
    provider = await oauth.initProvider({ ...providerInfo }, req.publicBaseUrl)
  }
  if (!provider) return res.redirect(`${req.publicBaseUrl}/login?error=unknownOAuthProvider`)
  const relayState = [
    provider.state,
    req.headers.referer,
    (req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl).replace('?id_token=', ''),
    req.query.org || '',
    req.query.dep || '',
    req.query.invit_token || ''
  ]
  const authorizationUri = provider.authorizationUri(relayState, req.query.email)
  debugOAuth('login authorizationUri', authorizationUri)
  res.redirect(authorizationUri)
})

router.get('/oauth/:oauthId/login', oauthLogin)
router.get('/oidc/:oauthId/login', oauthLogin)

const oauthCallback = asyncWrap(async (req, res, next) => {
  const storage = req.app.get('storage')
  debugOAuth('oauth login callback')

  if (!req.query.state) {
    console.error('missing OAuth state')
    throw new Error('Bad OAuth state')
  }
  const [providerState, loginReferer, redirect, org, dep, invitToken] = JSON.parse(req.query.state)

  const returnError = (error, errorCode) => {
    debugSAML('login return error', error, errorCode)
    if (loginReferer) {
      const refererUrl = new URL(loginReferer)
      refererUrl.searchParams.set('error', error)
      res.redirect(refererUrl.href)
    } else {
      res.status(errorCode).send(req.messages.errors[error] || error)
    }
  }

  let provider
  if (!req.site) {
    provider = oauth.providers.find(p => p.state === providerState)
  } else {
    for (const providerInfo of req.site.authProviders) {
      const p = await oauth.initProvider({ ...providerInfo }, req.publicBaseUrl)
      if (p.state === providerState) {
        provider = p
        break
      }
    }
  }
  if (!provider) return res.status(404).send('Unknown OAuth provider')
  if (req.params.oauthId && req.params.oauthId !== provider.id) return res.status(404).send('Wrong OAuth provider id')

  if (req.query.error) {
    console.log('Bad OAuth query', req.query)
    return returnError('badIDPQuery', 500)
  }

  const accessToken = await provider.accessToken(req.query.code)

  const userInfo = await provider.userInfo(accessToken)
  if (!userInfo.email) {
    console.error('Email attribute not fetched from OAuth', provider.id, userInfo)
    throw new Error('Email attribute not fetched from OAuth')
  }
  debugOAuth('Got user info from oauth', provider.id, userInfo)

  const oauthInfo = { ...userInfo, logged: new Date().toISOString() }

  // used to create a user and accept a member invitation at the same time
  // if the invitation is not valid, better not to proceed with the user creation
  let invit, invitOrga
  if (invitToken) {
    try {
      invit = unshortenInvit(await tokens.verify(req.app.get('keys'), invitToken))
    } catch (err) {
      return returnError(err.name === 'TokenExpiredError' ? 'expiredInvitationToken' : 'invalidInvitationToken', 400)
    }
    invitOrga = await storage.getOrganization(invit.id)
    if (!invitOrga) return returnError('orgaUnknown', 400)
    if (invit.email !== userInfo.email) return returnError('badProviderInvitEmail', 400)
  }

  // check for user with same email
  let user = await storage.getUserByEmail(userInfo.email, req.site)

  if (!user && !invit && config.onlyCreateInvited) {
    return returnError('onlyCreateInvited', 400)
  }

  // Re-create a user that was never validated.. first clean temporary user
  if (user && user.emailConfirmed === false) {
    if (user.organizations && invit) {
      // This user was created empty from an invitation in 'alwaysAcceptInvitations' mode
    } else {
      await storage.deleteUser(user.id)
      user = null
    }
  }

  if (!user) {
    if ((!invit && config.onlyCreateInvited) || storage.readonly) {
      return returnError('userUnknown', 403)
    }
    user = {
      email: userInfo.email,
      id: shortid.generate(),
      firstName: userInfo.firstName || '',
      lastName: userInfo.lastName || '',
      emailConfirmed: true,
      [provider.type || 'oauth']: {
        [provider.id]: oauthInfo
      }
    }
    if (req.site) user.host = req.site.host
    if (invit) {
      user.defaultOrg = invitOrga.id
      user.ignorePersonalAccount = true
    }
    user.name = userName(user)
    debugOAuth('Create user authenticated through oauth', user)
    await storage.createUser(user, null, new URL(redirect).host)

    if (req.site) {
      let createMember = false
      if (provider.createMember === true) {
        // retro-compatibility for when createMember was a boolean
        createMember = true
      } else if (provider.createMember && provider.createMember.type === 'always') {
        createMember = true
      } else if (provider.createMember && provider.createMember.type === 'emailDomain' && user.email.endsWith(`@${provider.createMember.emailDomain}`)) {
        createMember = true
      }
      if (createMember) {
        const siteOrga = await storage.getOrganization(req.site.owner.id)
        await storage.addMember(siteOrga, user, 'user')
      }
    }
  } else {
    debugOAuth('Existing user authenticated through oauth', user, userInfo)
    const patch = { [provider.type | 'oauth']: { ...user.oauth, [provider.id]: oauthInfo }, emailConfirmed: true }
    if (userInfo.firstName && !user.firstName) patch.firstName = userInfo.firstName
    if (userInfo.lastName && !user.lastName) patch.lastName = userInfo.lastName
    await storage.patchUser(user.id, patch)
  }

  if (invit && !config.alwaysAcceptInvitation) {
    if (storage.db) {
      const consumer = { type: 'organization', id: invitOrga.id }
      const limit = await limits.get(storage.db, consumer, 'store_nb_members')
      if (limit.consumption >= limit.limit && limit.limit > 0) return res.status(400).send(req.messages.errors.maxNbMembers)
    }
    await storage.addMember(invitOrga, user, invit.role, invit.department)
    sendNotification({
      sender: { type: 'organization', id: invitOrga.id, name: invitOrga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: req.__all('notifications.acceptedInvitation', { name: user.name, email: user.email, orgName: invitOrga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    if (storage.db) await limits.setNbMembers(storage.db, invitOrga.id)
  }

  const payload = { ...tokens.getPayload(user), temporary: true }
  const linkUrl = tokens.prepareCallbackUrl(req, payload, redirect, invitOrga ? { id: invit.id, department: invit.department } : { id: org, department: dep })
  debugOAuth(`OAuth based authentication of user ${user.name}`)
  res.redirect(linkUrl.href)
})

// kept for retro-compatibility
router.get('/oauth/:oauthId/callback', oauthCallback)
router.get('/oauth-callback', oauthCallback)

// SAML 2
const debugSAML = require('debug')('saml')

// expose metadata to declare ourselves to identity provider
router.get('/saml2-metadata.xml', (req, res) => {
  res.type('application/xml')
  res.send(saml2.sp.getMetadata())
})

// starts login
router.get('/saml2/:providerId/login', asyncWrap(async (req, res) => {
  debugSAML('login request', req.params.providerId)
  const idp = saml2.idps[req.params.providerId]
  if (!idp) return res.redirect(`${req.publicBaseUrl}/login?error=unknownSAMLProvider`)

  // relay_state is used to remember some information about the login attempt
  const relayState = [
    req.headers.referer,
    (req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl).replace('?id_token=', ''),
    req.query.org || '',
    req.query.invit_token || ''
  ]
  // relay state should be a request level parameter but it is not in current version of samlify
  // cf https://github.com/tngan/samlify/issues/163
  saml2.sp.entitySetting.relayState = JSON.stringify(relayState)
  const { context: loginRequestURL } = saml2.sp.createLoginRequest(idp, 'redirect', { nameid: req.query.email })
  const parsedURL = new URL(loginRequestURL)
  if (req.query.email) parsedURL.searchParams.append('login_hint', req.query.email)
  debugSAML('redirect', parsedURL.href)
  res.redirect(parsedURL.href)
}))

// login confirm by IDP
router.post('/saml2-assert', asyncWrap(async (req, res) => {
  const storage = req.app.get('storage')

  const providerId = saml2.getProviderId(req.headers.referer)
  const idp = saml2.idps[providerId]
  if (!idp) return res.status(404).send(`unknown saml2 provider ${providerId}`)

  debugSAML('saml2 assert full body', req.body)
  const samlResponse = await saml2.sp.parseLoginResponse(idp, 'post', req)
  debugSAML('login success', JSON.stringify(samlResponse.extract, null, 2))

  const [loginReferer, redirect, org, invitToken] = JSON.parse(req.body.RelayState)

  const returnError = (error, errorCode) => {
    debugSAML('login return error', error, errorCode)
    if (loginReferer) {
      const refererUrl = new URL(loginReferer)
      refererUrl.searchParams.set('error', error)
      res.redirect(refererUrl.href)
    } else {
      res.status(errorCode).send(req.messages.errors[error] || error)
    }
  }

  const email = samlResponse.extract.attributes.email || samlResponse.extract.attributes['urn:oid:0.9.2342.19200300.100.1.3']
  if (!email) {
    console.error('Email attribute not fetched from SAML', providerId, samlResponse.extract.attributes)
    throw new Error('Email attribute not fetched from OAuth')
  }
  debugSAML('Got user info from saml', providerId, samlResponse.extract.attributes)

  const samlInfo = { ...samlResponse.extract.attributes, logged: new Date().toISOString() }

  // used to create a user and accept a member invitation at the same time
  // if the invitation is not valid, better not to proceed with the user creation
  let invit, invitOrga
  if (invitToken) {
    try {
      invit = unshortenInvit(await tokens.verify(req.app.get('keys'), invitToken))
    } catch (err) {
      return returnError(err.name === 'TokenExpiredError' ? 'expiredInvitationToken' : 'invalidInvitationToken', 400)
    }
    invitOrga = await storage.getOrganization(invit.id)
    if (!invitOrga) return returnError('orgaUnknown', 400)
    if (invit.email !== email) return returnError('badProviderInvitEmail', 400)
  }

  // check for user with same email
  let user = await storage.getUserByEmail(email, req.site)

  if (!user && !invit && config.onlyCreateInvited) {
    return returnError('onlyCreateInvited', 400)
  }

  // Re-create a user that was never validated.. first clean temporary user
  if (user && user.emailConfirmed === false) {
    if (user.organizations && invit) {
      // This user was created empty from an invitation in 'alwaysAcceptInvitations' mode
    } else {
      await storage.deleteUser(user.id)
      user = null
    }
  }

  if (!user) {
    if ((!invit && config.onlyCreateInvited) || storage.readonly) {
      return returnError('userUnknown', 403)
    }
    user = {
      email,
      id: shortid.generate(),
      emailConfirmed: true,
      saml2: {
        [providerId]: samlInfo
      }
    }
    if (req.site) user.host = req.site.host
    if (invit) {
      user.defaultOrg = invitOrga.id
      user.ignorePersonalAccount = true
    }
    // TODO: also a dynamic mapping
    if (samlInfo.firstName) user.firstName = samlInfo.firstName
    if (samlInfo.lastName) user.lastName = samlInfo.lastName
    user.name = userName(user)
    debugSAML('Create user', user)
    await storage.createUser(user, null, new URL(redirect).host)
  } else {
    debugSAML('Existing user authenticated', providerId, user)
    const patch = { saml2: { ...user.saml2, [providerId]: samlInfo }, emailConfirmed: true }
    // TODO: map more attributes ? lastName, firstName, avatarUrl ?
    await storage.patchUser(user.id, patch)
  }

  if (invit && !config.alwaysAcceptInvitation) {
    if (storage.db) {
      const consumer = { type: 'organization', id: invitOrga.id }
      const limit = await limits.get(storage.db, consumer, 'store_nb_members')
      if (limit.consumption >= limit.limit && limit.limit > 0) return res.status(400).send(req.messages.errors.maxNbMembers)
    }
    await storage.addMember(invitOrga, user, invit.role, invit.department)
    sendNotification({
      sender: { type: 'organization', id: invitOrga.id, name: invitOrga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: req.__all('notifications.acceptedInvitation', { name: user.name, email: user.email, orgName: invitOrga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    if (storage.db) await limits.setNbMembers(storage.db, invitOrga.id)
  }

  const payload = { ...tokens.getPayload(user), temporary: true }
  const linkUrl = tokens.prepareCallbackUrl(req, payload, redirect, invitOrga ? invitOrga.id : org)
  debugSAML(`SAML based authentication of user ${user.name}`)
  res.redirect(linkUrl.href)

  // TODO: Save name_id and session_index for logout ?
  // Note:  In practice these should be saved in the user session, not globally.
  // name_id = saml_response.user.name_id;
  // session_index = saml_response.user.session_index;
}))

// logout not implemented
router.get('/saml2-logout', (req, res) => {
  console.warn('SAML GET logout not yet implemented', req.headers, req.query)
  res.send()
})
router.post('/saml2-logout', (req, res) => {
  console.lowarng('SAML POST logout not yet implemented', req.headers, req.query, req.body)
  res.send()
})

router.get('/saml2/providers', (req, res) => {
  // TODO: per-site auth providers
  if (req.site) return res.send([])
  res.send(oauth.publicProviders)
})

// starts logout
/* router.get('/saml2/:providerId/logout', () => {
  var options = {
    name_id: name_id,
    session_index: session_index
  };

  sp.create_logout_request_url(idp, options, function(err, logout_url) {
    if (err != null)
      return res.send(500);
    res.redirect(logout_url);
  });
}) */
