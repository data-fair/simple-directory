import config, { superadmin } from '#config'
import { Router, type RequestHandler } from 'express'
import { reqUser, reqIp, reqSiteUrl, reqUserAuthenticated, session, httpError } from '@data-fair/lib-express'
import { pushEvent } from '@data-fair/lib-node/events-queue.js'
import bodyParser from 'body-parser'
import { nanoid } from 'nanoid'
import Cookies from 'cookies'
import Debug from 'debug'
import { sendMail, postUserIdentityWebhook, getOidcProviderId, oauthGlobalProviders, initOidcProvider, getOAuthProviderById, getOAuthProviderByState, reqSite, getSiteByHost, check2FASession, is2FAValid, cookie2FAName, getTokenPayload, prepareCallbackUrl, signToken, decodeToken, setSessionCookies, getDefaultUserOrg, unsetSessionCookies, keepalive, logoutOAuthToken, readOAuthToken, writeOAuthToken, authCoreProviderMemberInfo, patchCoreOAuthUser, unshortenInvit, getLimits, setNbMembersLimit, getSamlProviderId, saml2GlobalProviders, saml2ServiceProvider } from '#services'
import type { SdStorage } from '../storages/interface.ts'
import type { User, UserWritable } from '#types'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import emailValidator from 'email-validator'
import { reqI18n, __all } from '#i18n'
import limiter from '../utils/limiter.ts'
import storages from '#storages'
import { checkPassword, type Password } from '../utils/passwords.ts'
import { type OpenIDConnect } from '#types/site/index.ts'
import { publicProviders } from './providers.ts'

const debug = Debug('auth')

const router = Router()
export default router

// these routes accept url encoded form data so that they can be used from basic
// html forms
router.use(bodyParser.urlencoded({ limit: '100kb' }))

async function confirmLog (storage: SdStorage, user: User) {
  if (!storage.readonly) {
    await storage.updateLogged(user.id)
    if (user.emailConfirmed === false) {
      await storage.confirmEmail(user.id)
      postUserIdentityWebhook(user)
    }
  }
}

const rejectCoreIdUser: RequestHandler = (req, res, next) => {
  if (reqUser(req)?.idp) return res.status(403).send('This route is not available for users with a core identity provider')
  next()
}

// Authenticate a user based on his email address and password
router.post('/password', rejectCoreIdUser, async (req, res, next) => {
  const logContext: EventLogContext = { req }

  if (!req.body || !req.body.email) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  if (!req.body.password) return res.status(400).send(reqI18n(req).messages.errors.badCredentials)

  const { body, query } = (await import('#doc/auth/post-password-req/index.ts')).returnValid(req, { name: 'req' })

  const returnError = async (error: string, errorCode: number) => {
    // prevent attacker from analyzing response time
    await new Promise(resolve => setTimeout(resolve, Math.round(Math.random() * 1000)))
    const referer = req.headers.referer || req.headers.referrer
    if (req.is('application/x-www-form-urlencoded') && typeof referer === 'string') {
      const refererUrl = new URL(referer)
      refererUrl.searchParams.set('error', error)
      res.redirect(refererUrl.href)
    } else {
      res.status(errorCode).send(reqI18n(req).messages.errors[error] || error)
    }
  }

  try {
    await limiter(req).consume(reqIp(req), 1)
    await limiter(req).consume(body.email, 1)
  } catch (err) {
    console.error('Rate limit error for /password route', reqIp(req), body.email, err)
    eventsLog.warn('sd.auth.password.rate-limit', `rate limit error for /auth/password route ${body.email}`, logContext)
    return returnError('rateLimitAuth', 429)
  }

  const orgId = body.org || query.org
  const depId = body.dep || query.dep
  let org, dep
  if (orgId && typeof orgId === 'string') {
    org = await storages.globalStorage.getOrganization(orgId)
    if (!org) {
      eventsLog.info('sd.auth.password.fail', `a user failed to authenticate due to unknown org ${orgId}`, logContext)
      return returnError('badCredentials', 400)
    }
    if (depId) {
      dep = org.departments?.find(d => d.id === depId)
      if (!dep) {
        eventsLog.info('sd.auth.password.fail', `a user failed to authenticate due to unknown dep ${orgId} / ${depId}`, logContext)
        return returnError('badCredentials', 400)
      }
    }
  }

  let storage = storages.globalStorage
  if (body.orgStorage && org) {
    storage = await storages.createOrgStorage(org) ?? storage
  }

  if (config.adminCredentials?.password && config.adminCredentials.email === body.email) {
    const validPassword = await checkPassword(body.password, config.adminCredentials.password as Password)
    if (validPassword) {
      const payload = getTokenPayload(superadmin)
      payload.adminMode = 1
      const callbackUrl = (await prepareCallbackUrl(req, payload, query.redirect)).href
      debug('Password based authentication of superadmin with password from config', callbackUrl)
      eventsLog.info('sd.auth.admin-auth', 'a user authenticated using the /auth/password route with special admin account', logContext)
      return res.send(callbackUrl)
    } else {
      eventsLog.alert('sd.auth.password.admin-fail', 'a user failed to authenticate using the /auth/password route with special admin account', logContext)
      return returnError('badCredentials', 400)
    }
  }

  const site = await reqSite(req)
  let user = await storage.getUserByEmail(body.email, site)
  logContext.user = user
  let userFromMainHost = false
  if (!user || user.emailConfirmed === false) {
    if (site) {
      user = await storage.getUserByEmail(body.email)
      userFromMainHost = true
    }
    if (!user) return returnError('badCredentials', 400)
  }
  if (storage.getPassword) {
    const storedPassword = await storage.getPassword(user.id)
    const validPassword = await checkPassword(body.password, storedPassword)
    if (!validPassword) {
      eventsLog.info('sd.auth.password.fail', `a user failed to authenticate with a wrong password email=${body.email}`, logContext)
      return returnError('badCredentials', 400)
    }
  } else if (storage.checkPassword) {
    if (!await storage.checkPassword(user.id, body.password)) {
      eventsLog.info('sd.auth.password.fail', `a user failed to authenticate with a wrong password email=${body.email}`, logContext)
      return returnError('badCredentials', 400)
    }
  } else {
    throw new Error('missing password verification implementation')
  }
  if (org && body.membersOnly && !user.organizations.find(o => o.id === org.id)) {
    eventsLog.info('sd.auth.password.fail', 'a user failed to authenticate as they are not a member of targeted org', logContext)
    return returnError('badCredentials', 400)
  }

  if (userFromMainHost && site) {
    const payload = {
      id: user.id,
      email: user.email,
      action: 'changeHost'
    }
    const token = await signToken(payload, config.jwtDurations.initialToken)
    const changeHostUrl = new URL((site.host.startsWith('localhost') ? 'http://' : 'https://') + site.host + '/simple-directory/login')
    changeHostUrl.searchParams.set('action_token', token)
    eventsLog.info('sd.auth.password.change-host', 'a user is suggested to switch to secondary host', logContext)
    if (req.is('application/x-www-form-urlencoded')) {
      return res.redirect(changeHostUrl.href)
    } else {
      return res.send(changeHostUrl.href)
    }
  }

  const payload = getTokenPayload(user)
  if (body.adminMode) {
    if (payload.isAdmin) payload.adminMode = 1
    else {
      eventsLog.alert('sd.auth.password.not-admin', 'a unauthorized user tried to activate admin mode', logContext)
      return returnError('adminModeOnly', 403)
    }
  } else if (body.rememberMe) {
    payload.rememberMe = true
  }
  // 2FA management
  const user2FA = await storage.get2FA(user.id)
  if ((user2FA && user2FA.active) || await storage.required2FA(user)) {
    if (await check2FASession(req, user.id)) {
      // 2FA was already validated earlier and present in a cookie
    } else if (body['2fa']) {
      if (!await is2FAValid(user2FA?.secret, body['2fa'].trim())) {
        // a token was sent but it is not an actual 2FA token, instead it is the special recovery token
        if (user2FA?.recovery) {
          const validRecovery = await checkPassword(body['2fa'].trim(), user2FA.recovery)
          if (validRecovery) {
            await storages.globalStorage.patchUser(user.id, { '2FA': { active: false } })
            eventsLog.info('sd.auth.password.fail', 'a user tried to use a recovery token as a normal token', logContext)
            return returnError('2fa-missing', 403)
          }
        }
        eventsLog.info('sd.auth.password.fail', 'a user tried to use a bad 2fa token', logContext)
        return returnError('2fa-bad-token', 403)
      } else {
        // 2FA token sent alongside email/password
        const cookies = new Cookies(req, res)
        const token = await signToken({ user: user.id }, config.jwtDurations['2FAToken'])
        const payload = decodeToken(token)
        const cookieOpts: Cookies.SetOption = { sameSite: 'lax', httpOnly: true }
        if (payload?.exp) cookieOpts.expires = new Date(payload.exp * 1000)
        cookies.set(cookie2FAName(user.id), token, cookieOpts)
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
    const token = await signToken(payload, config.jwtDurations.exchangedToken)
    setSessionCookies(req, res, token, getDefaultUserOrg(user, orgId, depId))
    debug(`Password based authentication of user ${user.name}, form mode`)
    res.redirect(query.redirect || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory/me')
  } else {
    const callbackUrl = (await prepareCallbackUrl(req, payload, query.redirect, getDefaultUserOrg(user, orgId, depId), body.orgStorage)).href
    debug(`Password based authentication of user ${user.name}, ajax mode`, callbackUrl)
    res.send(callbackUrl)
  }
})

// Either find or create an user based on an email address then send a mail with a link and a token
// to check that this address belongs to the user.
router.post('/passwordless', rejectCoreIdUser, async (req, res, next) => {
  const logContext: EventLogContext = { req }

  if (!config.passwordless) return res.status(400).send(reqI18n(req).messages.errors.noPasswordless)
  if (!req.body || !req.body.email) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)

  const { body, query } = (await import('#doc/auth/post-passwordless-req/index.ts')).returnValid(req, { name: 'req' })

  try {
    await limiter(req).consume(reqIp(req), 1)
  } catch (err) {
    eventsLog.warn('sd.auth.passwordless.rate-limit', `rate limit error for /auth/passwordless route ${body.email}`, logContext)
    return res.status(429).send(reqI18n(req).messages.errors.rateLimitAuth)
  }

  let org
  if (body.org) {
    org = await storages.globalStorage.getOrganization(body.org)
    if (!org) {
      eventsLog.info('sd.auth.passwordless.fail', `a passwordless authentication failed due to unknown org ${body.org}`, logContext)
      return res.status(404).send(reqI18n(req).messages.errors.orgaUnknown)
    }
  }

  let storage = storages.globalStorage
  if (body.orgStorage && org) {
    storage = await storages.createOrgStorage(org) ?? storage
  }
  const user = await storage.getUserByEmail(body.email, await reqSite(req))
  logContext.user = user

  const redirect = query.redirect || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory'
  const redirectUrl = new URL(redirect)

  // No 404 here so we don't disclose information about existence of the user
  if (!user || user.emailConfirmed === false) {
    await sendMail('noCreation', reqI18n(req).messages, body.email, { link: redirect, host: redirectUrl.host, origin: redirectUrl.origin })
    eventsLog.info('sd.auth.passwordless.no-user', `a passwordless authentication failed because of missing user and a warning mail was sent ${req.body.email}`, logContext)
    return res.status(204).send()
  }

  if (org && body.membersOnly && !user.organizations.find(o => o.id === org.id)) {
    if (!org) {
      eventsLog.info('sd.auth.passwordless.fail', `a passwordless authentication failed due to unknown org ${body.org}`, logContext)
      return res.status(404).send(reqI18n(req).messages.errors.orgaUnknown)
    }
  }

  const payload = getTokenPayload(user)
  if (req.body.rememberMe) payload.rememberMe = true

  // passwordless is not compatible with 2FA for now
  if (await storage.get2FA(user.id) || await storage.required2FA(user)) {
    eventsLog.info('sd.auth.passwordless.fail', 'a passwordless authentication failed due to incompatibility with 2fa', logContext)
    return res.status(400).send(reqI18n(req).messages.errors.passwordless2FA)
  }

  const linkUrl = await prepareCallbackUrl(req, payload, query.redirect, getDefaultUserOrg(user, body.org, body.dep), body.orgStorage)
  debug(`Passwordless authentication of user ${user.name}`)
  await sendMail('login', reqI18n(req).messages, user.email, { link: linkUrl.href, host: linkUrl.host, origin: linkUrl.origin })
  eventsLog.info('sd.auth.passwordless.ok', 'a user successfully sent a authentication email', logContext)
  res.status(204).send()
})

// use current session and redirect to a secondary site
router.post('/site_redirect', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const loggedUser = reqUserAuthenticated(req)
  const currentSite = await reqSite(req)
  if (currentSite) return res.status(400).send()
  const storage = storages.globalStorage
  const user = await storage.getUserByEmail(loggedUser.email)
  if (!user) return res.status(404).send('user not found')
  if (!req.body.redirect) return res.status(400).send()
  const site = await getSiteByHost(new URL(req.body.redirect).host)
  if (!site) return res.status(404).send('site not found')
  const payload = getTokenPayload(user)
  const callbackUrl = (await prepareCallbackUrl(req, payload, req.body.redirect, getDefaultUserOrg(user, req.body.org, req.body.dep))).href
  debug(`Redirect auth of user ${user.name} to site ${site.host}`, callbackUrl)

  eventsLog.info('sd.auth.redirect-site', 'a authenticated user is redirected to secondary site with session', logContext)
  res.send(callbackUrl)
})

router.get('/token_callback', async (req, res, next) => {
  const logContext: EventLogContext = { req }

  const { query } = (await import('#doc/auth/post-token-callback-req/index.ts')).returnValid(req, { name: 'req' })

  const redirectError = (error: string) => {
    eventsLog.info('sd.auth.callback.fail', `a token callback failed with error ${error}`, logContext)
    res.redirect(`${reqSiteUrl(req) + '/simple-directory'}/login?error=${encodeURIComponent(error)}`)
  }

  if (!query.id_token) return redirectError('missingToken')
  let decoded
  try {
    decoded = await session.verifyToken(query.id_token)
  } catch (err) {
    return redirectError('invalidToken')
  }

  let org
  if (query.id_token_org) {
    org = await storages.globalStorage.getOrganization(query.id_token_org)
    if (!org) return redirectError('orgaUnknown')
  }
  let storage = storages.globalStorage
  if (req.query.org_storage === 'true' && org) {
    storage = await storages.createOrgStorage(org) ?? storage
  }
  const user = decoded.id === '_superadmin' ? superadmin : await storage.getUser(decoded.id)
  logContext.user = user

  if (!user || (decoded.emailConfirmed !== true && user.emailConfirmed === false)) {
    return redirectError('badCredentials')
  }

  const reboundRedirect = query.redirect || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory/me'

  const payload = getTokenPayload(user)
  if (decoded.rememberMe) payload.rememberMe = true
  if (decoded.adminMode && payload.isAdmin) payload.adminMode = 1
  const token = await signToken(payload, config.jwtDurations.exchangedToken)

  await confirmLog(storage, user)
  setSessionCookies(req, res, token, getDefaultUserOrg(user, query.id_token_org, query.id_token_dep))

  eventsLog.info('sd.auth.callback.ok', 'a session was initialized after successful auth', logContext)

  // we just confirmed the user email after creation, he might want to create an organization
  if (decoded.emailConfirmed && config.quotas.defaultMaxCreatedOrgs !== 0 && !org && !reboundRedirect.startsWith(`${reqSiteUrl(req) + '/simple-directory'}/login`)) {
    const redirectUrl = new URL(`${reqSiteUrl(req) + '/simple-directory'}/login`)
    redirectUrl.searchParams.set('step', 'createOrga')
    redirectUrl.searchParams.set('redirect', reboundRedirect)
    debug('redirect to createOrga step', redirectUrl.href)
    res.redirect(redirectUrl.href)
  } else if (user.plannedDeletion) {
    const redirectUrl = new URL(`${reqSiteUrl(req) + '/simple-directory'}/login`)
    redirectUrl.searchParams.set('step', 'plannedDeletion')
    redirectUrl.searchParams.set('redirect', reboundRedirect)
    debug('redirect to plannedDeletion step', redirectUrl.href)
    res.redirect(redirectUrl.href)
  } else {
    res.redirect(reboundRedirect)
  }
})

// Used to extend an older but still valid token from a user
// TODO: deprecate this whole route, replaced by simpler /keepalive
router.post('/exchange', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const { query } = (await import('#doc/auth/post-exchange-req/index.ts')).returnValid(req, { name: 'req' })

  const idToken = ((req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop()) || query.id_token) as string | undefined
  if (!idToken) {
    return res.status(401).send('No id_token cookie provided')
  }
  let decoded
  try {
    decoded = await session.verifyToken(idToken)
  } catch (err) {
    eventsLog.info('sd.auth.exchange.fail', 'a user tried to prolongate a session with invalid token', logContext)
    return res.status(401).send('Invalid id_token')
  }

  // User may have new organizations since last renew
  const storage = storages.globalStorage
  const user = decoded.id === '_superadmin' ? superadmin : await storage.getUser(decoded.id)
  logContext.user = user

  if (!user) {
    eventsLog.info('sd.auth.exchange.fail', 'a deleted user tried to prolongate a session', logContext)
    return res.status(401).send('User does not exist anymore')
  }
  const payload = getTokenPayload(user)
  if (decoded.adminMode && req.query.noAdmin !== 'true') payload.adminMode = 1
  if (decoded.asAdmin) {
    payload.asAdmin = decoded.asAdmin
    payload.name = decoded.name
    delete payload.isAdmin
  } else {
    if (!storage.readonly) {
      await storage.updateLogged(decoded.id)
      if (user.emailConfirmed === false) {
        eventsLog.info('sd.auth.exchange.fail', 'a email was confirmed for the first time', logContext)
        await storage.confirmEmail(decoded.id)
        postUserIdentityWebhook(user)
      }
    }
  }
  if (decoded.rememberMe) payload.rememberMe = true
  const token = await signToken(payload, config.jwtDurations.exchangedToken)

  eventsLog.info('sd.auth.exchange.ok', 'a session token was successfully exchanged for a new one', logContext)

  debug(`Exchange session token for user ${user.name}`)

  // TODO: sending token in response is deprecated and will be removed ?
  res.set('Deprecation', 'true')
  res.send(token)
})

router.post('/keepalive', async (req, res, next) => {
  const loggedUser = reqUserAuthenticated(req)
  const storage = storages.globalStorage
  const user = loggedUser.id === '_superadmin' ? superadmin : await storage.getUser(loggedUser.id)
  if (!user) throw httpError(404)

  const coreIdProvider = user.coreIdProvider
  if (coreIdProvider && coreIdProvider.type === 'oauth') {
    let provider
    const site = await reqSite(req)
    if (!site) {
      provider = oauthGlobalProviders().find(p => p.id === coreIdProvider.id)
    } else {
      const providerInfo = site.authProviders?.find(p => p.type === 'oidc' && getOidcProviderId(p.discovery) === coreIdProvider.id) as OpenIDConnect
      provider = await initOidcProvider(providerInfo, reqSiteUrl(req) + '/simple-directory')
    }
    if (!provider) {
      unsetSessionCookies(req, res)
      return res.status(401).send('Fournisseur d\'identité principal inconnu')
    }
    const oauthToken = (await readOAuthToken(user, provider))

    if (!oauthToken) {
      unsetSessionCookies(req, res)
      return res.status(401).send('Pas de jeton de session sur le fournisseur d\'identité principal')
    }
    if (oauthToken.loggedOut) {
      unsetSessionCookies(req, res)
      return res.status(401).send('Utilisateur déconnecté depuis le fournisseur d\'identité principal')
    }
    const tokenJson = oauthToken.token

    try {
      const refreshedToken = await provider.refreshToken(tokenJson, true)
      if (refreshedToken) {
        const { newToken, offlineRefreshToken } = refreshedToken
        const userInfo = await provider.userInfo(newToken.access_token)
        const memberInfo = await authCoreProviderMemberInfo(await reqSite(req), provider, user.email, userInfo)
        await patchCoreOAuthUser(provider, user, userInfo, memberInfo)
        await writeOAuthToken(user, provider, newToken, offlineRefreshToken)
        eventsLog.info('sd.auth.keepalive.oauth-refresh-ok', `a user refreshed their info from their core identity provider ${provider.id}`, { req })
      }
    } catch (err: any) {
      unsetSessionCookies(req, res)
      eventsLog.info('sd.auth.keepalive.oauth-refresh-ko', `a user failed to refresh their info from their core identity provider ${provider.id} (${err.message})`, { req })
      // TODO: can we be confident enough in this to actually delete the user ? or maybe flag it as disabled so that it is removed from listings ?
      return res.status(401).send('Échec de prolongation de la session avec le fournisseur d\'identité principal')
    }
  }

  debug(`Exchange session token for user ${loggedUser.name}`)
  await keepalive(req, res, user)
  res.status(204).send()
})

router.delete('/', async (req, res) => {
  const logContext: EventLogContext = { req }

  unsetSessionCookies(req, res)
  eventsLog.info('sd.auth.session-delete', 'a session was deleted', logContext)
  res.status(204).send()
})

// Send an email to confirm user identity before authorizing an action
router.post('/action', async (req, res, next) => {
  const logContext: EventLogContext = { req }

  if (!req.body || !req.body.email) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  if (!req.body.action) return res.status(400).send(reqI18n(req).messages.errors.badCredentials)

  try {
    await limiter(req).consume(reqIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /action route', reqIp(req), req.body.email, err)
    eventsLog.warn('sd.auth.action.rate-limit', 'rate limit error for /action route', logContext)
    return res.status(429).send(reqI18n(req).messages.errors.rateLimitAuth)
  }

  const storage = storages.globalStorage
  let user = await storage.getUserByEmail(req.body.email, await reqSite(req))
  logContext.user = user
  let action = req.body.action
  if (!user && await reqSite(req)) {
    user = await storage.getUserByEmail(req.body.email)
    action = 'changeHost'
  }
  // No 404 here so we don't disclose information about existence of the user
  if (!user || user.emailConfirmed === false) {
    const link = req.body.target || config.defaultLoginRedirect || (reqSiteUrl(req) + '/simple-directory/login')
    const linkUrl = new URL(link)
    await sendMail('noCreation', reqI18n(req).messages, req.body.email, { link, host: linkUrl.host, origin: linkUrl.origin })
    eventsLog.info('sd.auth.action.fail', `an action ${action} failed because of missing user and a warning mail was sent ${req.body.email}`, logContext)
    return res.status(204).send()
  }
  const payload = {
    id: user.id,
    email: user.email,
    action
  }
  const token = await signToken(payload, config.jwtDurations.initialToken)
  const linkUrl = new URL(req.body.target || reqSiteUrl(req) + '/simple-directory/login')
  linkUrl.searchParams.set('action_token', token)

  await sendMail('action', reqI18n(req).messages, user.email, { link: linkUrl.href, host: linkUrl.host, origin: linkUrl.origin })
  eventsLog.info('sd.auth.action.ok', `an action email ${action} was sent`, logContext)
  res.status(204).send()
})

router.delete('/adminmode', async (req, res, next) => {
  const user = reqUserAuthenticated(req)
  if (!user.adminMode) return res.status(403).send('This route is only available in admin mode')
  req.query.noAdmin = 'true'
  await keepalive(req, res)

  res.status(204).send()
})

// create a session as a user but from a super admin session
router.post('/asadmin', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const loggedUser = reqUserAuthenticated(req)
  if (!loggedUser.adminMode) return res.status(403).send('This functionality is for admins only')
  const storage = storages.globalStorage
  const user = await storage.getUser(req.body.id)
  if (!user) return res.status(404).send('User does not exist')
  const payload = getTokenPayload(user)
  payload.name += ' (administration)'
  payload.asAdmin = { id: loggedUser.id, name: loggedUser.name }
  delete payload.isAdmin
  const token = await signToken(payload, config.jwtDurations.exchangedToken)
  debug(`Exchange session token for user ${user.name} from an admin session`)
  setSessionCookies(req, res, token, getDefaultUserOrg(user))

  eventsLog.info('sd.auth.asadmin.ok', 'a session was created as a user from an admin session', logContext)

  res.status(204).send()
})

router.delete('/asadmin', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const loggedUser = reqUserAuthenticated(req)
  if (!loggedUser.asAdmin) return res.status(403).send('This functionality is for admins only')
  const storage = storages.globalStorage
  const user = loggedUser.asAdmin.id === '_superadmin' ? superadmin : await storage.getUser(loggedUser.asAdmin.id)
  if (!user) return res.status(401).send('User does not exist anymore')
  const payload = getTokenPayload(user)
  payload.adminMode = 1
  const token = await signToken(payload, config.jwtDurations.exchangedToken)
  debug(`Exchange session token for user ${user.name} from an asAdmin session`)
  setSessionCookies(req, res, token, getDefaultUserOrg(user))

  eventsLog.info('sd.auth.asadmin.done', 'a session as a user from an admin session was terminated', logContext)

  res.status(204).send()
})

router.get('/me', (req, res) => {
  if (!reqUser(req)) return res.status(404).send()
  else res.send(reqUser(req))
})

router.get('/providers', async (req, res) => {
  res.send(await publicProviders(await reqSite(req)))
})

// OAUTH
const debugOAuth = Debug('oauth')

const oauthLogin: RequestHandler = async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const provider = await getOAuthProviderById(req, req.params.oauthId)
  if (!provider) {
    eventsLog.info('sd.auth.oauth.fail', 'a user tried to login with an unknown oauth provider', logContext)
    return res.redirect(`${reqSiteUrl(req) + '/simple-directory'}/login?error=unknownOAuthProvider`)
  }
  const relayState = [
    provider.state,
    req.headers.referer,
    (req.query.redirect as string || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory').replace('?id_token=', ''),
    req.query.org || '',
    req.query.dep || '',
    req.query.invit_token || '',
    req.query.adminMode || '' // TODO: force re-submit password in this case ?
  ]
  const authorizationUri = provider.authorizationUri(relayState, req.query.email as string, provider.coreIdProvider, req.query.adminMode === 'true')
  debugOAuth('login authorizationUri', authorizationUri)
  eventsLog.info('sd.auth.oauth.redirect', 'a user was redirected to a oauth provider', logContext)
  res.redirect(authorizationUri)
}

router.get('/oauth/:oauthId/login', oauthLogin)
router.get('/oidc/:oauthId/login', oauthLogin)

const oauthCallback: RequestHandler = async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const site = await reqSite(req)

  const storage = storages.globalStorage
  debugOAuth('oauth login callback')

  if (!req.query.state) {
    console.error('missing OAuth state')
    throw new Error('Bad OAuth state')
  }
  const [providerState, loginReferer, redirect, org, dep, invitToken, adminMode] = JSON.parse(req.query.state as string)

  const returnError = (error: string, errorCode: number) => {
    eventsLog.info('sd.auth.oauth.fail', `a user failed to authenticate with oauth due to ${error}`, logContext)
    debugOAuth('login return error', error, errorCode)
    if (loginReferer) {
      const refererUrl = new URL(loginReferer)
      refererUrl.searchParams.set('error', error)
      res.redirect(refererUrl.href)
    } else {
      res.status(errorCode).send(reqI18n(req).messages.errors[error] || error)
    }
  }

  const provider = await getOAuthProviderByState(req, providerState)
  if (!provider) return res.status(404).send('Unknown OAuth provider')
  if (req.params.oauthId && req.params.oauthId !== provider.id) return res.status(404).send('Wrong OAuth provider id')

  if (req.query.error) {
    console.log('Bad OAuth query', req.query)
    return returnError('badIDPQuery', 500)
  }

  const { token, offlineRefreshToken } = await provider.getToken(req.query.code as string, provider.coreIdProvider)
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
      invit = unshortenInvit(await session.verifyToken(invitToken))
      eventsLog.info('sd.auth.oauth.invit', `a user was invited to join an organization ${invit.id}`, logContext)
    } catch (err: any) {
      return returnError(err.name === 'TokenExpiredError' ? 'expiredInvitationToken' : 'invalidInvitationToken', 400)
    }
    invitOrga = await storage.getOrganization(invit.id)
    if (!invitOrga) return returnError('orgaUnknown', 400)
    if (invit.email !== userInfo.user.email) return returnError('badProviderInvitEmail', 400)
  }

  // check for user with same email
  let user = await storage.getUserByEmail(userInfo.user.email, site)
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
      user = undefined
    }
  }

  const memberInfo = await authCoreProviderMemberInfo(site, provider, userInfo.user.email, oauthInfo)

  if (invit && memberInfo.create) throw new Error('Cannot create a member from a identity provider and accept an invitation at the same time')

  if (!user) {
    if ((!invit && config.onlyCreateInvited) || storage.readonly) {
      return returnError('userUnknown', 403)
    }

    const newUser: UserWritable = {
      ...userInfo.user,
      id: nanoid(),
      emailConfirmed: true,
      [provider.type || 'oauth']: {
        [provider.id]: { ...oauthInfo, coreId: provider.coreIdProvider ? true : undefined }
      },
      coreIdProvider: provider.coreIdProvider ? { type: provider.type || 'oauth', id: provider.id } : undefined,
      organizations: []
    }
    if (site) newUser.host = site.host
    if (invit && invitOrga) {
      newUser.defaultOrg = invitOrga.id
      newUser.ignorePersonalAccount = true
    } else if (memberInfo.create && memberInfo.org) {
      newUser.defaultOrg = memberInfo.org.id
      newUser.ignorePersonalAccount = true
    }
    debugOAuth('Create user authenticated through oauth', user)
    logContext.user = user
    eventsLog.info('sd.auth.oauth.create-user', `a user was created in oauth callback ${newUser.id}`, logContext)
    user = await storage.createUser(newUser, undefined, new URL(redirect).host)

    if (memberInfo.create && memberInfo.org) {
      logContext.account = { type: 'organization', ...memberInfo.org }
      eventsLog.info('sd.auth.oauth.create-member', `a user was added as a member in oauth callback ${user.id} / ${memberInfo.role}`, logContext)
      await storage.addMember(memberInfo.org, user, memberInfo.role, null, memberInfo.readOnly)
    }
  } else {
    if (user.coreIdProvider && (user.coreIdProvider.type !== 'oauth' || user.coreIdProvider.id !== provider.id)) {
      return res.status(400).send('Utilisateur déjà lié à un autre fournisseur d\'identité principale')
    }
    debugOAuth('Existing user authenticated through oauth', user, userInfo)
    await patchCoreOAuthUser(provider, user, oauthInfo, memberInfo)
  }

  if (invit && invitOrga && !config.alwaysAcceptInvitation) {
    const limits = await getLimits(invitOrga)
    if (limits.store_nb_members.limit >= 0 && limits.store_nb_members.consumption >= limits.store_nb_members.limit) {
      return res.status(400).send(reqI18n(req).messages.errors.maxNbMembers)
    }

    await storage.addMember(invitOrga, user, invit.role, invit.department)
    eventsLog.info('sd.auth.oauth.accept-invite', `a user accepted an invitation in oauth callback ${user.id}`, logContext)
    pushEvent({
      sender: { type: 'organization', id: invitOrga.id, name: invitOrga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: __all('notifications.acceptedInvitation', { name: user.name, email: user.email, orgName: invitOrga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    await setNbMembersLimit(invitOrga.id)
  }

  if (provider.coreIdProvider) {
    await writeOAuthToken(user, provider, token, offlineRefreshToken)
  }

  const payload = getTokenPayload(user)
  if (adminMode) {
    // TODO: also check that the user actually inputted the password on this redirect
    if (payload.isAdmin) payload.adminMode = 1
    else {
      eventsLog.alert('sd.auth.oauth.not-admin', 'a unauthorized user tried to activate admin mode', logContext)
      return returnError('adminModeOnly', 403)
    }
  }
  const linkUrl = await prepareCallbackUrl(req, payload, redirect, (invit && invitOrga)
    ? { id: invit.id, department: invit.department }
    : { id: org as string, department: dep as string })
  debugOAuth(`OAuth based authentication of user ${user.name}`)
  res.redirect(linkUrl.href)
}

// kept for retro-compatibility
router.get('/oauth/:oauthId/callback', oauthCallback)
router.get('/oauth-callback', oauthCallback)

const oauthLogoutCallback: RequestHandler = async (req, res, next) => {
  if (!req.body.logout_token) return res.status(400).send('missing logout_token')
  const decoded = decodeToken(req.body.logout_token)
  if (!decoded) return res.status(400).send('invalid logout_token')
  if (decoded.typ !== 'Logout') return res.status(400).send('invalid logout_token type')
  if (!decoded.sid) return res.status(400).send('missing sid in logout_token')
  await logoutOAuthToken(decoded.sid)
  res.status(204).send()
}

router.get('/oauth-logout', oauthLogoutCallback)
router.post('/oauth-logout', oauthLogoutCallback)

// SAML 2
const debugSAML = Debug('saml')

// expose metadata to declare ourselves to identity provider
router.get('/saml2-metadata.xml', (req, res) => {
  res.type('application/xml')
  res.send(saml2ServiceProvider().getMetadata())
})

// starts login
router.get('/saml2/:providerId/login', async (req, res) => {
  const logContext: EventLogContext = { req }

  debugSAML('login request', req.params.providerId)
  const provider = saml2GlobalProviders().find(p => p.id === req.params.providerId)
  if (!provider) {
    eventsLog.info('sd.auth.saml.fail', 'a user tried to login with an unknown saml provider', logContext)
    return res.redirect(`${reqSiteUrl(req) + '/simple-directory'}/login?error=unknownSAMLProvider`)
  }

  // relay_state is used to remember some information about the login attempt
  const relayState = [
    req.headers.referer,
    (req.query.redirect as string || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory').replace('?id_token=', ''),
    req.query.org || '',
    req.query.invit_token || '',
    req.query.adminMode || '' // TODO: force re-submit password in this case ?
  ]
  // relay state should be a request level parameter but it is not in current version of samlify
  // cf https://github.com/tngan/samlify/issues/163
  const sp = saml2ServiceProvider()
  sp.entitySetting.relayState = JSON.stringify(relayState)

  // TODO: apply nameid parameter ? { nameid: req.query.email }
  const { context: loginRequestURL } = sp.createLoginRequest(provider.idp, 'redirect')

  const parsedURL = new URL(loginRequestURL)
  if (typeof req.query.email === 'string') parsedURL.searchParams.append('login_hint', req.query.email)
  debugSAML('redirect', parsedURL.href)
  eventsLog.info('sd.auth.saml.redirect', 'a user was redirected to a saml provider', logContext)
  res.redirect(parsedURL.href)
})

// login confirm by IDP
router.post('/saml2-assert', async (req, res) => {
  const logContext: EventLogContext = { req }

  const site = await reqSite(req)
  const storage = storages.globalStorage
  const providers = saml2GlobalProviders()
  const sp = saml2ServiceProvider()

  let provider
  const referer = (req.headers.referer || req.headers.referrer) as string | undefined
  if (!referer && providers.length === 1) provider = providers[0]
  else if (referer) {
    const providerId = getSamlProviderId(referer)
    provider = providers.find(p => p.id === providerId)
  }

  if (!provider) return res.status(404).send('unknown saml2 provider')

  debugSAML('saml2 assert full body', req.body)
  const samlResponse = await sp.parseLoginResponse(provider.idp, 'post', req)
  debugSAML('login success', JSON.stringify(samlResponse.extract, null, 2))

  const [loginReferer, redirect, org, invitToken, adminMode] = JSON.parse(req.body.RelayState)

  const returnError = (error: string, errorCode: number) => {
    eventsLog.info('sd.auth.saml.fail', `a user failed to authenticate with saml due to ${error}`, logContext)
    debugSAML('login return error', error, errorCode)
    if (loginReferer) {
      const refererUrl = new URL(loginReferer)
      refererUrl.searchParams.set('error', error)
      res.redirect(refererUrl.href)
    } else {
      res.status(errorCode).send(reqI18n(req).messages.errors[error] || error)
    }
  }

  const email = samlResponse.extract.attributes.email || samlResponse.extract.attributes['urn:oid:0.9.2342.19200300.100.1.3']
  if (!email) {
    console.error('Email attribute not fetched from SAML', provider.id, samlResponse.extract.attributes)
    eventsLog.info('sd.auth.saml.fail', 'a user failed to authenticate with saml due to missing email', logContext)
    throw new Error('Email attribute not fetched from OAuth')
  }
  debugSAML('Got user info from saml', provider.id, samlResponse.extract.attributes)

  const samlInfo = { ...samlResponse.extract.attributes, logged: new Date().toISOString() }

  // used to create a user and accept a member invitation at the same time
  // if the invitation is not valid, better not to proceed with the user creation
  let invit, invitOrga
  if (invitToken) {
    try {
      invit = unshortenInvit(await session.verifyToken(invitToken))
    } catch (err: any) {
      return returnError(err.name === 'TokenExpiredError' ? 'expiredInvitationToken' : 'invalidInvitationToken', 400)
    }
    invitOrga = await storage.getOrganization(invit.id)
    if (!invitOrga) return returnError('orgaUnknown', 400)
    if (invit.email !== email) return returnError('badProviderInvitEmail', 400)
  }

  // check for user with same email
  let user = await storage.getUserByEmail(email, site)

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
      user = undefined
    }
  }

  if (!user) {
    if ((!invit && config.onlyCreateInvited) || storage.readonly) {
      return returnError('userUnknown', 403)
    }
    const newUser: UserWritable = {
      email,
      id: nanoid(),
      emailConfirmed: true,
      saml2: {
        [provider.id]: samlInfo
      },
      organizations: []
    }
    if (site) newUser.host = site.host
    if (invit && invitOrga) {
      newUser.defaultOrg = invitOrga.id
      newUser.ignorePersonalAccount = true
    }
    // TODO: also a dynamic mapping
    if (samlInfo.firstName) newUser.firstName = samlInfo.firstName
    if (samlInfo.lastName) newUser.lastName = samlInfo.lastName
    debugSAML('Create user', newUser)
    user = await storage.createUser(newUser, undefined, new URL(redirect).host)
    logContext.user = user
    eventsLog.info('sd.auth.saml.create-user', `a user was created in saml callback ${user.id}`, logContext)
  } else {
    if (user.coreIdProvider && (user.coreIdProvider.type !== 'saml' || user.coreIdProvider.id !== provider.id)) {
      return res.status(400).send('Utilisateur déjà lié à un autre fournisseur d\'identité principale')
    }
    debugSAML('Existing user authenticated', provider.id, user)
    const patch = { saml2: { ...user.saml2, [provider.id]: samlInfo }, emailConfirmed: true }
    // TODO: map more attributes ? lastName, firstName ?
    await storage.patchUser(user.id, patch)
    eventsLog.info('sd.auth.saml.update-user', `a user was updated in saml callback ${user.id}`, logContext)
  }

  if (invit && invitOrga && !config.alwaysAcceptInvitation) {
    const limits = await getLimits(invitOrga)
    if (limits.store_nb_members.limit >= 0 && limits.store_nb_members.consumption >= limits.store_nb_members.limit) {
      return res.status(400).send(reqI18n(req).messages.errors.maxNbMembers)
    }
    await storage.addMember(invitOrga, user, invit.role, invit.department)
    eventsLog.info('sd.auth.saml.accept-invite', `a user accepted an invitation in saml callback ${user.id}`, logContext)
    pushEvent({
      sender: { type: 'organization', id: invitOrga.id, name: invitOrga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: __all('notifications.acceptedInvitation', { name: user.name, email: user.email, orgName: invitOrga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    await setNbMembersLimit(invitOrga.id)
  }

  const payload = getTokenPayload(user)
  if (adminMode) {
    // TODO: also check that the user actually inputted the password on this redirect
    if (payload.isAdmin) payload.adminMode = 1
    else {
      eventsLog.alert('sd.auth.saml.not-admin', 'a unauthorized user tried to activate admin mode', logContext)
      return returnError('adminModeOnly', 403)
    }
  }
  const linkUrl = await prepareCallbackUrl(req, payload, redirect, invitOrga ? invitOrga.id : org)
  debugSAML(`SAML based authentication of user ${user.name}`)
  res.redirect(linkUrl.href)

  // TODO: Save name_id and session_index for logout ?
  // Note:  In practice these should be saved in the user session, not globally.
  // name_id = saml_response.user.name_id;
  // session_index = saml_response.user.session_index;
})

// logout not implemented
router.get('/saml2-logout', (req, res) => {
  console.warn('SAML GET logout not yet implemented', req.headers, req.query)
  res.send()
})
router.post('/saml2-logout', (req, res) => {
  console.warn('SAML POST logout not yet implemented', req.headers, req.query, req.body)
  res.send()
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
    res.redirect(logout_url);async
  });
}) */
