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

const rejectCoreIdUser = (req, res, next) => {
  if (req.user?.coreIdProvider) return res.status(403).send('This route is not available for users with a core identity provider')
  next()
}

// Authenticate a user based on his email address and password
router.post('/password', rejectCoreIdUser, asyncWrap(async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  if (!req.body.password) return res.status(400).send(req.messages.errors.badCredentials)

  const returnError = async (error, errorCode) => {
    // prevent attacker from analyzing response time
    await new Promise(resolve => setTimeout(resolve, Math.round(Math.random() * 1000)))
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
    eventsLog.warn('sd.auth.password.rate-limit', `rate limit error for /auth/password route ${req.body.email}`, logContext)
    return returnError('rateLimitAuth', 429)
  }

  const orgId = req.body.org || req.query.org
  const depId = req.body.dep || req.query.dep
  let org, dep
  if (orgId && typeof orgId === 'string') {
    org = await req.app.get('storage').getOrganization(orgId)
    if (!org) {
      eventsLog.info('sd.auth.password.fail', `a user failed to authenticate due to unknown org ${orgId}`, logContext)
      return returnError('badCredentials', 400)
    }
    if (depId) {
      dep = org.departments.find(d => d.id === depId)
      if (!dep) {
        eventsLog.info('sd.auth.password.fail', `a user failed to authenticate due to unknown dep ${orgId} / ${depId}`, logContext)
        return returnError('badCredentials', 400)
      }
    }
  }

  let storage = req.app.get('storage')
  if (req.body.orgStorage && org.orgStorage && org.orgStorage.active && config.perOrgStorageTypes.includes(org.orgStorage.type)) {
    storage = await storages.init(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }

  if (config.adminCredentials?.password?.hash && config.adminCredentials.email === req.body.email) {
    const validPassword = await passwords.checkPassword(req.body.password, config.adminCredentials.password)
    if (validPassword) {
      const superadmin = { id: '_superadmin', name: 'Super Admin', email: req.body.email }
      const payload = tokens.getPayload(superadmin)
      payload.adminMode = true
      const callbackUrl = tokens.prepareCallbackUrl(req, payload, req.query.redirect).href
      debug('Password based authentication of superadmin with password from config', callbackUrl)
      eventsLog.info('sd.auth.admin-auth', 'a user authenticated using the /auth/password route with special admin account', logContext)
      return res.send(callbackUrl)
    } else {
      eventsLog.alert('sd.auth.password.admin-fail', 'a user failed to authenticate using the /auth/password route with special admin account', logContext)
      return returnError('badCredentials', 400)
    }
  }

  let user = await storage.getUserByEmail(req.body.email, req.site)
  logContext.user = user
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
    if (!validPassword) {
      eventsLog.info('sd.auth.password.fail', `a user failed to authenticate with a wrong password email=${req.body.email}`, logContext)
      return returnError('badCredentials', 400)
    }
  } else {
    if (!await storage.checkPassword(user.id, req.body.password)) {
      eventsLog.info('sd.auth.password.fail', `a user failed to authenticate with a wrong password email=${req.body.email}`, logContext)
      return returnError('badCredentials', 400)
    }
  }
  if (org && req.body.membersOnly && !user.organizations.find(o => o.id === org.id)) {
    eventsLog.info('sd.auth.password.fail', 'a user failed to authenticate as they are not a member of targeted org', logContext)
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
    eventsLog.info('sd.auth.password.change-host', 'a user is suggested to switch to secondary host', logContext)
    if (req.is('application/x-www-form-urlencoded')) {
      return res.redirect(changeHostUrl.href)
    } else {
      return res.send(changeHostUrl.href)
    }
  }

  const payload = tokens.getPayload(user)
  if (req.body.adminMode) {
    if (payload.isAdmin) payload.adminMode = true
    else {
      eventsLog.alert('sd.auth.password.not-admin', 'a unauthorized user tried to activate admin mode', logContext)
      return returnError('adminModeOnly', 403)
    }
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
            eventsLog.info('sd.auth.password.fail', 'a user tried to use a recovery token as a normal token', logContext)
            return returnError('2fa-missing', 403)
          }
        }
        eventsLog.info('sd.auth.password.fail', 'a user tried to use a bad 2fa token', logContext)
        return returnError('2fa-bad-token', 403)
      } else {
        // 2FA token sent alongside email/password
        const cookies = new Cookies(req, res)
        const token = tokens.sign(req.app.get('keys'), { user: user.id }, config.jwtDurations['2FAToken'])
        cookies.set(twoFA.cookieName(user.id), token, { expires: new Date(tokens.decode(token).exp * 1000), sameSite: 'lax', httpOnly: true })
      }
    } else {
      if (!user2FA || !user2FA.active) {
        eventsLog.info('sd.auth.password.fail', 'a user tried to login without having configured 2fa', logContext)
        return returnError('2fa-missing', 403)
      } else {
        eventsLog.info('sd.auth.password.fail', 'a user tried to login without 2fa', logContext)
        return returnError('2fa-required', 403)
      }
    }
  }

  eventsLog.info('sd.auth.password.ok', 'a user successfully authenticated using password', logContext)
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
router.post('/passwordless', rejectCoreIdUser, asyncWrap(async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!config.passwordless) return res.status(400).send(req.messages.errors.noPasswordless)
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)

  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    eventsLog.warn('sd.auth.passwordless.rate-limit', `rate limit error for /auth/passwordless route ${req.body.email}`, logContext)
    return res.status(429).send(req.messages.errors.rateLimitAuth)
  }

  let org
  if (req.body.org) {
    org = await req.app.get('storage').getOrganization(req.body.org)
    if (!org) {
      eventsLog.info('sd.auth.passwordless.fail', `a passwordless authentication failed due to unknown org ${req.body.org}`, logContext)
      return res.status(404).send(req.messages.errors.orgaUnknown)
    }
  }

  let storage = req.app.get('storage')
  if (req.body.orgStorage && org.orgStorage && org.orgStorage.active && config.perOrgStorageTypes.includes(org.orgStorage.type)) {
    storage = await storages.init(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }
  const user = await storage.getUserByEmail(req.body.email, req.site)
  logContext.user = user

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
    eventsLog.info('sd.auth.passwordless.no-user', `a passwordless authentication failed because of missing user and a warning mail was sent ${req.body.email}`, logContext)
    return res.status(204).send()
  }

  if (org && req.body.membersOnly === 'true' && !user.organizations.find(o => o.id === org.id)) {
    if (!org) {
      eventsLog.info('sd.auth.passwordless.fail', `a passwordless authentication failed due to unknown org ${req.body.org}`, logContext)
      return res.status(404).send(req.messages.errors.orgaUnknown)
    }
  }

  const payload = tokens.getPayload(user)
  if (req.body.rememberMe) payload.rememberMe = true
  payload.temporary = true

  // passwordless is not compatible with 2FA for now
  if (await storage.get2FA(user.id) || await storage.required2FA(payload)) {
    eventsLog.info('sd.auth.passwordless.fail', 'a passwordless authentication failed due to incompatibility with 2fa', logContext)
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
  eventsLog.info('sd.auth.passwordless.ok', 'a user successfully sent a authentication email', logContext)
  res.status(204).send()
}))

// use current session and redirect to a secondary site
router.post('/site_redirect', asyncWrap(async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

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

  eventsLog.info('sd.auth.redirect-site', 'a authenticated user is redirected to secondary site with session', logContext)
  res.send(callbackUrl)
}))

router.get('/token_callback', asyncWrap(async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  const redirectError = (error) => {
    eventsLog.info('sd.auth.callback.fail', `a token callback failed with error ${error}`, logContext)
    res.redirect(`${req.publicBaseUrl}/login?error=${encodeURIComponent(error)}`)
  }

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
  logContext.user = user

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

  eventsLog.info('sd.auth.callback.ok', 'a session was initialized after successful auth', logContext)

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
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  const idToken = (req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop()) || req.query.id_token
  if (!idToken) {
    return res.status(401).send('No id_token cookie provided')
  }
  let decoded
  try {
    decoded = await tokens.verify(req.app.get('keys'), idToken)
  } catch (err) {
    eventsLog.info('sd.auth.exchange.fail', 'a user tried to prolongate a session with invalid token', logContext)
    return res.status(401).send('Invalid id_token')
  }

  // User may have new organizations since last renew
  const storage = req.app.get('storage')
  const user = decoded.id === '_superadmin' ? decoded : await storage.getUser({ id: decoded.id })
  logContext.user = user

  if (!user) {
    eventsLog.info('sd.auth.exchange.fail', 'a deleted user tried to prolongate a session', logContext)
    return res.status(401).send('User does not exist anymore')
  }
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
        eventsLog.info('sd.auth.exchange.fail', 'a email was confirmed for the first time', logContext)
        await storage.confirmEmail(decoded.id)
        webhooks.postIdentity('user', user)
      }
    }
  }
  if (decoded.rememberMe) payload.rememberMe = true
  const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)

  eventsLog.info('sd.auth.exchange.ok', 'a session token was successfully exchanged for a new one', logContext)

  debug(`Exchange session token for user ${user.name}`)

  // TODO: sending token in response is deprecated and will be removed ?
  res.set('Deprecation', 'true')
  res.send(token)
}))

router.post('/keepalive', asyncWrap(async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default

  if (!req.user) return res.status(401).send('No active session to keep alive')
  const storage = req.app.get('storage')
  const user = req.user.id === '_superadmin' ? req.user : await storage.getUser({ id: req.user.id })

  if (user.coreIdProvider && user.coreIdProvider.type === 'oauth') {
    let provider
    if (!req.site) {
      provider = oauth.providers.find(p => p.id === user.coreIdProvider.id)
    } else {
      const providerInfo = req.site.authProviders.find(p => oauth.getProviderId(p.discovery) === user.coreIdProvider.id)
      provider = await oauth.initProvider({ ...providerInfo }, req.publicBaseUrl)
    }
    if (!provider) {
      tokens.unsetCookies(req, res)
      return res.status(401).send('Fournisseur d\'identité principal inconnu')
    }
    const oauthToken = (await storage.readOAuthToken(user, provider))

    if (!oauthToken) {
      tokens.unsetCookies(req, res)
      return res.status(401).send('Pas de jeton de session sur le fournisseur d\'identité principal')
    }
    if (oauthToken.loggedOut) {
      tokens.unsetCookies(req, res)
      return res.status(401).send('Utilisateur déconnecté depuis le fournisseur d\'identité principal')
    }
    const tokenJson = oauthToken.token

    try {
      const refreshedToken = await provider.refreshToken(tokenJson, true)
      if (refreshedToken) {
        const { newToken, offlineRefreshToken } = refreshedToken
        const userInfo = await provider.userInfo(newToken.access_token)
        const memberInfo = await authCoreProviderMemberInfo(storage, req.site, provider, user.email)
        await patchCoreOAuthUser(storage, provider, user, userInfo, memberInfo)
        await storage.writeOAuthToken(user, provider, newToken, offlineRefreshToken)
        eventsLog.info('sd.auth.keepalive.oauth-refresh-ok', `a user refreshed their info from their core identity provider ${provider.id}`, { req })
      }
    } catch (err) {
      tokens.unsetCookies(req, res)
      eventsLog.info('sd.auth.keepalive.oauth-refresh-ko', `a user failed to refresh their info from their core identity provider ${provider.id} (${err.message})`, { req })
      // TODO: can we be confident enough in this to actually delete the user ? or maybe flag it as disabled so that it is removed from listings ?
      return res.status(401).send('Échec de prolongation de la session avec le fournisseur d\'identité principal')
    }
  }

  debug(`Exchange session token for user ${req.user.name}`)
  await tokens.keepalive(req, res, user)
  res.status(204).send()
}))

router.delete('/', asyncWrap(async (req, res) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  tokens.unsetCookies(req, res)
  eventsLog.info('sd.auth.session-delete', 'a session was deleted', logContext)
  res.status(204).send()
}))

// Send an email to confirm user identity before authorizing an action
router.post('/action', asyncWrap(async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  if (!req.body.action) return res.status(400).send(req.messages.errors.badCredentials)

  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /action route', requestIp.getClientIp(req), req.body.email, err)
    eventsLog.warn('sd.auth.action.rate-limit', 'rate limit error for /action route', logContext)
    return res.status(429).send(req.messages.errors.rateLimitAuth)
  }

  const storage = req.app.get('storage')
  let user = await storage.getUserByEmail(req.body.email, req.site)
  logContext.user = user
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
    eventsLog.info('sd.auth.action.fail', `an action ${action} failed because of missing user and a warning mail was sent ${req.body.email}`, logContext)
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
  eventsLog.info('sd.auth.action.ok', `an action email ${action} was sent`, logContext)
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

// create a session as a user but from a super admin session
router.post('/asadmin', asyncWrap(async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.user) return res.status(401).send()
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

  eventsLog.info('sd.auth.asadmin.ok', 'a session was created as a user from an admin session', logContext)

  res.status(204).send()
}))

router.delete('/asadmin', asyncWrap(async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

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

  eventsLog.info('sd.auth.asadmin.done', 'a session as a user from an admin session was terminated', logContext)

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
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  let provider
  if (!req.site) {
    provider = oauth.providers.find(p => p.id === req.params.oauthId)
  } else {
    const providerInfo = req.site.authProviders.find(p => oauth.getProviderId(p.discovery) === req.params.oauthId)
    provider = await oauth.initProvider({ ...providerInfo }, req.publicBaseUrl)
  }
  if (!provider) {
    eventsLog.info('sd.auth.oauth.fail', 'a user tried to login with an unknown oauth provider', logContext)
    return res.redirect(`${req.publicBaseUrl}/login?error=unknownOAuthProvider`)
  }
  const relayState = [
    provider.state,
    req.headers.referer,
    (req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl).replace('?id_token=', ''),
    req.query.org || '',
    req.query.dep || '',
    req.query.invit_token || '',
    req.query.adminMode || '' // TODO: force re-submit password in this case ?
  ]
  const authorizationUri = provider.authorizationUri(relayState, req.query.email, provider.coreIdProvider)
  debugOAuth('login authorizationUri', authorizationUri)
  eventsLog.info('sd.auth.oauth.redirect', 'a user was redirected to a oauth provider', logContext)
  res.redirect(authorizationUri)
})

router.get('/oauth/:oauthId/login', oauthLogin)
router.get('/oidc/:oauthId/login', oauthLogin)

const patchCoreOAuthUser = exports.patchCoreOAuthUser = async (storage, provider, user, oauthInfo, memberInfo) => {
  const providerType = provider.type || 'oauth'
  if (provider.coreIdProvider) {
    oauthInfo.coreId = true
    oauthInfo.user.coreIdProvider = { type: providerType, id: provider.id }
  }
  const existingOAuthInfo = user[providerType]?.[provider.id]
  const patch = {
    [providerType]: { ...user[providerType] },
    emailConfirmed: true
  }
  patch[providerType][provider.id] = { ...existingOAuthInfo, ...oauthInfo }
  if (provider.coreIdProvider) {
    Object.assign(patch, oauthInfo.user)
    if (!memberInfo.readOnly) {
      if (memberInfo.create) {
        patch.defaultOrg = memberInfo.org.id
        patch.ignorePersonalAccount = true
        await storage.addMember(memberInfo.org, user, memberInfo.role, null, memberInfo.readOnly)
      } else {
        await storage.removeMember(memberInfo.org.id, user.id)
      }
    }
  } else {
    if (oauthInfo.user.firstName && !user.firstName) patch.firstName = oauthInfo.user.firstName
    if (oauthInfo.user.lastName && !user.lastName) patch.lastName = oauthInfo.user.lastName
  }
  await storage.patchUser(user.id, patch)
}

const authCoreProviderMemberInfo = exports.authCoreProviderMemberInfo = async (storage, site, provider, email, oauthInfo) => {
  let create = false
  if (provider.createMember === true) {
    // retro-compatibility for when createMember was a boolean
    create = true
  } else if (provider.createMember && provider.createMember.type === 'always') {
    create = true
  } else if (provider.createMember && provider.createMember.type === 'emailDomain' && email.endsWith(`@${provider.createMember.emailDomain}`)) {
    create = true
  }

  let org
  if (create) {
    const orgId = site ? site.owner.id : config.defaultOrg
    org = await storage.getOrganization(orgId)
    if (!org) throw new Error(`Organization not found ${orgId}`)
  }

  let role = 'user'
  let readOnly = false
  if (provider.coreIdProvider && provider.memberRole && provider.memberRole?.type !== 'none') {
    readOnly = true
  }
  if (provider.memberRole?.type === 'static') {
    role = provider.memberRole.role
  }
  if (provider.memberRole?.type === 'attribute') {
    role = oauthInfo.data[provider.memberRole.attribute]
  }

  return { create, org, readOnly, role }
}

const oauthCallback = asyncWrap(async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  const storage = req.app.get('storage')
  debugOAuth('oauth login callback')

  if (!req.query.state) {
    console.error('missing OAuth state')
    throw new Error('Bad OAuth state')
  }
  const [providerState, loginReferer, redirect, org, dep, invitToken, adminMode] = JSON.parse(req.query.state)

  const returnError = (error, errorCode) => {
    eventsLog.info('sd.auth.oauth.fail', `a user failed to authenticate with oauth due to ${error}`, logContext)
    debugOAuth('login return error', error, errorCode)
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

  const { token, offlineRefreshToken } = await provider.getToken(req.query.code, provider.coreIdProvider)
  const accessToken = token.access_token

  const userInfo = await provider.userInfo(accessToken)

  if (!userInfo.user.email) {
    console.error('Email attribute not fetched from OAuth', provider.id, userInfo)
    throw new Error('Email manquant dans les attributs de l\'utilisateur.')
  }
  debugOAuth('Got user info from oauth', provider.id, userInfo)

  const oauthInfo = { ...userInfo, logged: new Date().toISOString() }

  // used to create a user and accept a member invitation at the same time
  // if the invitation is not valid, better not to proceed with the user creation
  let invit, invitOrga
  if (invitToken) {
    try {
      invit = unshortenInvit(await tokens.verify(req.app.get('keys'), invitToken))
      eventsLog.info('sd.auth.oauth.invit', `a user was invited to join an organization ${invit.id}`, logContext)
    } catch (err) {
      return returnError(err.name === 'TokenExpiredError' ? 'expiredInvitationToken' : 'invalidInvitationToken', 400)
    }
    invitOrga = await storage.getOrganization(invit.id)
    if (!invitOrga) return returnError('orgaUnknown', 400)
    if (invit.email !== userInfo.user.email) return returnError('badProviderInvitEmail', 400)
  }

  // check for user with same email
  let user = await storage.getUserByEmail(userInfo.user.email, req.site)
  logContext.user = user

  if (!user && !invit && config.onlyCreateInvited) {
    return returnError('onlyCreateInvited', 400)
  }

  // Re-create a user that was never validated.. first clean temporary user
  if (user && user.emailConfirmed === false) {
    if (user.organizations && invit) {
      // This user was created empty from an invitation in 'alwaysAcceptInvitations' mode
    } else {
      eventsLog.info('sd.auth.oauth.del-temp-user', `a temporary user was deleted in oauth callback ${user.id}`, logContext)
      await storage.deleteUser(user.id)
      user = null
    }
  }

  const memberInfo = await authCoreProviderMemberInfo(storage, req.site, provider, userInfo.user.email, oauthInfo)

  if (invit && memberInfo.create) throw new Error('Cannot create a member from a identity provider and accept an invitation at the same time')

  if (!user) {
    if ((!invit && config.onlyCreateInvited) || storage.readonly) {
      return returnError('userUnknown', 403)
    }

    if (provider.coreIdProvider) {
      oauthInfo.coreId = true
      userInfo.user.coreIdProvider = { type: provider.type || 'oauth', id: provider.id }
    }

    user = {
      ...userInfo.user,
      id: shortid.generate(),
      firstName: userInfo.firstName || '',
      lastName: userInfo.lastName || '',
      emailConfirmed: true,
      [provider.type || 'oauth']: {
        [provider.id]: { ...oauthInfo }
      }
    }
    if (req.site) user.host = req.site.host
    if (invit) {
      user.defaultOrg = invitOrga.id
      user.ignorePersonalAccount = true
    } else if (memberInfo.create) {
      user.defaultOrg = memberInfo.org.id
      user.ignorePersonalAccount = true
    }
    user.name = userName(user)
    debugOAuth('Create user authenticated through oauth', user)
    logContext.user = user
    eventsLog.info('sd.auth.oauth.create-user', `a user was created in oauth callback ${user.id}`, logContext)
    await storage.createUser(user, null, new URL(redirect).host)

    if (memberInfo.create) {
      logContext.account = { type: 'organization', ...memberInfo.org }
      eventsLog.info('sd.auth.oauth.create-member', `a user was added as a member in oauth callback ${user.id} / ${memberInfo.role}`, logContext)
      await storage.addMember(memberInfo.org, user, memberInfo.role, null, memberInfo.readOnly)
    }
  } else {
    if (user.coreIdProvider && (user.coreIdProvider.type !== 'oauth' || user.coreIdProvider.id !== provider.id)) {
      return res.status(400).send('Utilisateur déjà lié à un autre fournisseur d\'identité principale')
    }
    debugOAuth('Existing user authenticated through oauth', user, userInfo)
    await patchCoreOAuthUser(storage, provider, user, oauthInfo, memberInfo)
  }

  if (invit && !config.alwaysAcceptInvitation) {
    if (storage.db) {
      const consumer = { type: 'organization', id: invitOrga.id }
      const limit = await limits.get(storage.db, consumer, 'store_nb_members')
      if (limit.consumption >= limit.limit && limit.limit > 0) return res.status(400).send(req.messages.errors.maxNbMembers)
    }
    await storage.addMember(invitOrga, user, invit.role, invit.department)
    eventsLog.info('sd.auth.oauth.accept-invite', `a user accepted an invitation in oauth callback ${user.id}`, logContext)
    sendNotification({
      sender: { type: 'organization', id: invitOrga.id, name: invitOrga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: req.__all('notifications.acceptedInvitation', { name: user.name, email: user.email, orgName: invitOrga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    if (storage.db) await limits.setNbMembers(storage.db, invitOrga.id)
  }

  if (provider.coreIdProvider) {
    await storage.writeOAuthToken(user, provider, token, offlineRefreshToken)
  }

  const payload = { ...tokens.getPayload(user), temporary: true }
  if (adminMode) {
    // TODO: also check that the user actually inputted the password on this redirect
    if (payload.isAdmin) payload.adminMode = true
    else {
      eventsLog.alert('sd.auth.oauth.not-admin', 'a unauthorized user tried to activate admin mode', logContext)
      return returnError('adminModeOnly', 403)
    }
  }
  const linkUrl = tokens.prepareCallbackUrl(req, payload, redirect, invitOrga ? { id: invit.id, department: invit.department } : { id: org, department: dep })
  debugOAuth(`OAuth based authentication of user ${user.name}`)
  res.redirect(linkUrl.href)
})

// kept for retro-compatibility
router.get('/oauth/:oauthId/callback', oauthCallback)
router.get('/oauth-callback', oauthCallback)

const oauthLogoutCallback = asyncWrap(async (req, res, next) => {
  if (!req.body.logout_token) return res.status(400).send('missing logout_token')
  const decoded = tokens.decode(req.body.logout_token)
  if (!decoded) return res.status(400).send('invalid logout_token')
  if (decoded.typ !== 'Logout') return res.status(400).send('invalid logout_token type')
  if (!decoded.sid) return res.status(400).send('missing sid in logout_token')
  const storage = req.app.get('storage')
  await storage.logoutOAuthToken(decoded.sid)
  res.status(204).send()
})

router.get('/oauth-logout', oauthLogoutCallback)
router.post('/oauth-logout', oauthLogoutCallback)

// SAML 2
const debugSAML = require('debug')('saml')

// expose metadata to declare ourselves to identity provider
router.get('/saml2-metadata.xml', (req, res) => {
  res.type('application/xml')
  res.send(saml2.sp.getMetadata())
})

// starts login
router.get('/saml2/:providerId/login', asyncWrap(async (req, res) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  debugSAML('login request', req.params.providerId)
  const idp = saml2.idps[req.params.providerId]
  if (!idp) {
    eventsLog.info('sd.auth.saml.fail', 'a user tried to login with an unknown saml provider', logContext)
    return res.redirect(`${req.publicBaseUrl}/login?error=unknownSAMLProvider`)
  }

  // relay_state is used to remember some information about the login attempt
  const relayState = [
    req.headers.referer,
    (req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl).replace('?id_token=', ''),
    req.query.org || '',
    req.query.invit_token || '',
    req.query.adminMode || '' // TODO: force re-submit password in this case ?
  ]
  // relay state should be a request level parameter but it is not in current version of samlify
  // cf https://github.com/tngan/samlify/issues/163
  saml2.sp.entitySetting.relayState = JSON.stringify(relayState)
  const { context: loginRequestURL } = saml2.sp.createLoginRequest(idp, 'redirect', { nameid: req.query.email })
  const parsedURL = new URL(loginRequestURL)
  if (req.query.email) parsedURL.searchParams.append('login_hint', req.query.email)
  debugSAML('redirect', parsedURL.href)
  eventsLog.info('sd.auth.saml.redirect', 'a user was redirected to a saml provider', logContext)
  res.redirect(parsedURL.href)
}))

// login confirm by IDP
router.post('/saml2-assert', asyncWrap(async (req, res) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  const storage = req.app.get('storage')

  let providerId
  if (!req.headers.referer && Object.keys(saml2.idps).length === 1) providerId = Object.keys(saml2.idps)[0]
  else providerId = saml2.getProviderId(req.headers.referer)
  if (!providerId) res.status(404).send(`undefined saml2 providerId ${providerId}`)

  const idp = saml2.idps[providerId]
  if (!idp) return res.status(404).send(`unknown saml2 provider ${providerId}`)

  debugSAML('saml2 assert full body', req.body)
  const samlResponse = await saml2.sp.parseLoginResponse(idp, 'post', req)
  debugSAML('login success', JSON.stringify(samlResponse.extract, null, 2))

  const [loginReferer, redirect, org, invitToken, adminMode] = JSON.parse(req.body.RelayState)

  const returnError = (error, errorCode) => {
    eventsLog.info('sd.auth.saml.fail', `a user failed to authenticate with saml due to ${error}`, logContext)
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
    eventsLog.info('sd.auth.saml.fail', 'a user failed to authenticate with saml due to missing email', logContext)
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
      eventsLog.info('sd.auth.saml.del-temp-user', `a temporary user was deleted in saml callback ${user.id}`, logContext)
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
    logContext.user = user
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
    eventsLog.info('sd.auth.saml.create-user', `a user was created in saml callback ${user.id}`, logContext)
  } else {
    if (user.coreIdProvider && (user.coreIdProvider.type !== 'saml' || user.coreIdProvider.id !== providerId)) {
      return res.status(400).send('Utilisateur déjà lié à un autre fournisseur d\'identité principale')
    }
    debugSAML('Existing user authenticated', providerId, user)
    const patch = { saml2: { ...user.saml2, [providerId]: samlInfo }, emailConfirmed: true }
    // TODO: map more attributes ? lastName, firstName, avatarUrl ?
    await storage.patchUser(user.id, patch)
    eventsLog.info('sd.auth.saml.update-user', `a user was updated in saml callback ${user.id}`, logContext)
  }

  if (invit && !config.alwaysAcceptInvitation) {
    if (storage.db) {
      const consumer = { type: 'organization', id: invitOrga.id }
      const limit = await limits.get(storage.db, consumer, 'store_nb_members')
      if (limit.consumption >= limit.limit && limit.limit > 0) return res.status(400).send(req.messages.errors.maxNbMembers)
    }
    await storage.addMember(invitOrga, user, invit.role, invit.department)
    eventsLog.info('sd.auth.saml.accept-invite', `a user accepted an invitation in saml callback ${user.id}`, logContext)
    sendNotification({
      sender: { type: 'organization', id: invitOrga.id, name: invitOrga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: req.__all('notifications.acceptedInvitation', { name: user.name, email: user.email, orgName: invitOrga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    if (storage.db) await limits.setNbMembers(storage.db, invitOrga.id)
  }

  const payload = { ...tokens.getPayload(user), temporary: true }
  if (adminMode) {
    // TODO: also check that the user actually inputted the password on this redirect
    if (payload.isAdmin) payload.adminMode = true
    else {
      eventsLog.alert('sd.auth.saml.not-admin', 'a unauthorized user tried to activate admin mode', logContext)
      return returnError('adminModeOnly', 403)
    }
  }
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
  console.warn('SAML POST logout not yet implemented', req.headers, req.query, req.body)
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
