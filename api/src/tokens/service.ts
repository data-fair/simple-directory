import type { SessionInfoPayload, Site, User } from '#types'
import type { Request, Response } from 'express'
import type { OrganizationMembership, SessionState, User as SessionUser } from '@data-fair/lib-express'
import { reqSession, reqSiteUrl, session, reqSitePath, reqSessionAuthenticated, httpError } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import { internalError } from '@data-fair/lib-node/observer.js'
import config, { jwtDurations } from '#config'
import jwt, { type SignOptions, type JwtPayload } from 'jsonwebtoken'
import Cookies from 'cookies'
import storages from '#storages'
import { getSignatureKeys } from './keys-manager.ts'
import { getRedirectSite, reqSite } from '#services'

export const signToken = async (payload: any, exp: string | number, notBefore?: string) => {
  const signatureKeys = await getSignatureKeys()
  const webKey = signatureKeys.webKeys[0]
  const params: SignOptions = {
    algorithm: webKey.alg,
    keyid: webKey.kid,
  }
  if (typeof exp === 'string') params.expiresIn = exp
  else payload.exp = exp
  if (notBefore) params.notBefore = notBefore
  return jwt.sign(payload, signatureKeys.privateKey, params)
}

export const decodeToken = (token: string) => jwt.decode(token) as JwtPayload

export const getTokenPayload = (user: Omit<User, 'created' | 'updated'>, site: Site | undefined) => {
  const payload: SessionState['user'] = {
    id: user.id,
    email: user.email,
    name: user.name,
    organizations: (user.organizations || []).map(o => ({ ...o }))
  }
  if (user.isAdmin || config.admins.includes(user.email) || user.id === '_superadmin') {
    payload.isAdmin = 1
  }
  if (user.defaultOrg) {
    let defaultOrg = payload.organizations.find(o => o.id === user.defaultOrg)
    if (user.defaultDep) defaultOrg = payload.organizations.find(o => o.id === user.defaultOrg && o.department === user.defaultDep)
    if (defaultOrg) defaultOrg.dflt = 1
  }
  if (user.ignorePersonalAccount) payload.ipa = 1
  if (user.plannedDeletion) payload.pd = user.plannedDeletion
  if (user.orgStorage) payload.os = 1
  // if (user.readonly) payload.readonly = user.readonly
  if (user.coreIdProvider) payload.idp = 1
  if (site) payload.siteOwner = site.owner
  return payload
}

export const getDefaultUserOrg = (user: User, reqOrgId?: string, reqDepId?: string) => {
  if (!user.organizations || !user.organizations.length) return
  if (reqOrgId) {
    let reqOrg
    if (reqDepId) {
      reqOrg = user.organizations.find(o => o.id === reqOrgId && o.department === reqDepId)
    } else {
      reqOrg = user.organizations.find(o => o.id === reqOrgId && !o.department) || user.organizations.find(o => o.id === reqOrgId)
    }
    if (reqOrg) return reqOrg
  }
  if (user.defaultOrg) {
    const defaultOrg = user.organizations.find(o => o.id === user.defaultOrg && (o.department || null) === (user.defaultDep || null))
    if (defaultOrg) return defaultOrg
  }
  if (user.ignorePersonalAccount) return user.organizations[0]
}

const secure = config.publicUrl.startsWith('https://')

export const logout = async (req: Request, res: Response) => {
  const cookies = new Cookies(req, res, { secure })
  const sitePath = reqSitePath(req)
  const opts: Cookies.SetOption = { path: sitePath + '/', expires: new Date(0) }
  // use '' instead of null because instant cookie expiration is not properly applied on all safari versions
  cookies.set('id_token', '', opts)
  cookies.set('id_token_sign', '', { ...opts, httpOnly: true })
  cookies.set('id_token_org', '', opts)
  cookies.set('id_token_dep', '', opts)
  cookies.set('id_token_ex', '', { ...opts, path: sitePath + '/simple-directory/', httpOnly: true })

  const exchangeToken = cookies.get('id_token_ex')
  const sessionState = reqSession(req)
  if (sessionState.user && exchangeToken) {
    const storage = await storages.getSessionStorage(sessionState)
    const serverSessionInfo = decodeToken(exchangeToken) as SessionInfoPayload | undefined
    if (serverSessionInfo?.session) await storage.deleteUserSession(sessionState.user.id, serverSessionInfo.session)
  }
}

// Split JWT strategy, the signature is in a httpOnly cookie for XSS prevention
// the header and payload are not httpOnly to be readable by client
// all cookies use sameSite for CSRF prevention
export const setSessionCookies = async (req: Request, res: Response, payload: SessionUser, serverSessionId: string | null, userOrg?: OrganizationMembership) => {
  const cookies = new Cookies(req, res, { secure })
  // cf https://www.npmjs.com/package/jsonwebtoken#token-expiration-exp-claim
  const date = Date.now()
  const exp = Math.floor(date / 1000) + jwtDurations.idToken
  const exchangeExp = Math.floor(date / 1000) + jwtDurations.exchangeToken
  const token = await signToken(payload, exp)
  const parts = token.split('.')
  const sitePath = reqSitePath(req)
  const opts: Cookies.SetOption = { sameSite: 'lax', path: sitePath + '/' }
  if (payload.rememberMe) opts.expires = new Date(exchangeExp * 1000)
  cookies.set('id_token', parts[0] + '.' + parts[1], { ...opts, httpOnly: false })
  cookies.set('id_token_sign', parts[2], { ...opts, expires: new Date(exp * 1000), httpOnly: true })
  // set the same params to id_token_org cookie so that it doesn't expire before the rest
  if (userOrg) {
    cookies.set('id_token_org', userOrg.id, { ...opts, httpOnly: false })
    if (userOrg.department) cookies.set('id_token_dep', userOrg.department, { ...opts, httpOnly: false })
  }

  const exchangeCookieOpts = { ...opts, expires: new Date(exchangeExp * 1000), path: sitePath + '/simple-directory/', httpOnly: true }
  if (serverSessionId !== null) {
    const existingExchangeToken = cookies.get('id_token_ex')
    let existingServerSessionInfo: SessionInfoPayload | undefined
    if (existingExchangeToken) {
      try {
        existingServerSessionInfo = (await session.verifyToken(existingExchangeToken)) as SessionInfoPayload | undefined
      } catch (err) {
        // ignore an old invalid exchange token
      }
    }
    if (existingServerSessionInfo && existingServerSessionInfo.session !== serverSessionId) {
      // case of a session where id_token was cleared but id_token_ex persisted, this server sessions is deprecated and can be cleared
      await storages.deleteSessionById(existingServerSessionInfo.session)
    }
    // const exchangeCookieOpts = { ...opts, httpOnly: true }
    const exchangeExp = Math.floor(date / 1000) + jwtDurations.exchangeToken
    const sessionInfo: SessionInfoPayload = { user: payload.id, session: serverSessionId, adminMode: payload.adminMode }
    // case of asAdmin
    if (existingServerSessionInfo && existingServerSessionInfo.adminMode && payload.id !== existingServerSessionInfo.user) {
      sessionInfo.adminMode = 1
      sessionInfo.user = existingServerSessionInfo.user
    }
    const exchangeToken = await signToken(sessionInfo, exchangeExp)
    cookies.set('id_token_ex', exchangeToken, exchangeCookieOpts)
  }
}

export const keepalive = async (req: Request, res: Response, _user?: User, removeAdminMode?: boolean) => {
  const sessionState = reqSessionAuthenticated(req)
  const logContext: EventLogContext = { req, account: (await reqSite(req))?.owner }

  // User may have new organizations since last renew
  let org
  if (sessionState.organization) {
    org = await storages.globalStorage.getOrganization(sessionState.organization.id)
    if (!org) {
      await logout(req, res)
      eventsLog.info('sd.auth.keepalive.fail', 'a user tried to prolongate a session in invalid org', logContext)
      throw httpError(401, 'Organisation inexistante')
    }
    logContext.account = { type: 'organization', id: org.id, name: org.name, department: sessionState.organization.department, departmentName: sessionState.organization.departmentName }
  }
  const storage = await storages.getSessionStorage(sessionState)
  const user = _user || await storage.getUser(sessionState.user.id)
  if (!user) {
    await logout(req, res)
    eventsLog.info('sd.auth.keepalive.fail', 'a deleted user tried to prolongate a session', logContext)
    throw httpError(401, 'Utilisateur inexistant')
  }

  const cookies = new Cookies(req, res, { secure })
  const idTokenOrg = cookies.get('id_token_org')
  const idTokenDep = cookies.get('id_token_dep')

  const exchangeToken = cookies.get('id_token_ex')
  let serverSessionInfo: SessionInfoPayload | undefined
  if (exchangeToken) {
    try {
      serverSessionInfo = await session.verifyToken(exchangeToken) as SessionInfoPayload | undefined
    } catch (err) {
      await logout(req, res)
      eventsLog.info('sd.auth.keepalive.fail', 'a user with a broken echange token tried to prolongate a session', logContext)
      throw httpError(401, 'Informations de session erronées')
    }
  }
  if (!serverSessionInfo) {
    // accept tokens signed by a key before the introduction of the exchange token (kid=simple-directory)
    // const payload = decodeToken(cookies.get('id_token'))
    const completeTokenInfo = jwt.decode(cookies.get('id_token') + '.' + cookies.get('id_token_sign'), { complete: true })
    if (completeTokenInfo?.header.kid === 'simple-directory') {
      console.log('accept tokens signed by a key before the introduction of the exchange token')
    } else {
      await logout(req, res)
      eventsLog.info('sd.auth.keepalive.fail', 'a user without a valid echange token tried to prolongate a session', logContext)
      throw httpError(401, 'Informations de session manquantes')
    }
  }
  if (sessionState.user.asAdmin) {
    const adminUser = await storage.getUser(sessionState.user.asAdmin.id)
    if (!adminUser) throw httpError(401, 'Utilisateur inexistant')
    if (serverSessionInfo) {
      if (serverSessionInfo.user !== adminUser.id) {
        await logout(req, res)
        eventsLog.info('sd.auth.keepalive.fail', 'a user in asAdmin mode with another user\'s exchange token tried to prolongate a session', logContext)
        throw httpError(401, 'Informations de session manquantes')
      }
      const serverSession = adminUser.sessions?.find(s => s.id === serverSessionInfo.session)
      if (!serverSession) {
        await logout(req, res)
        eventsLog.info('sd.auth.keepalive.fail', 'a user in asAdmin mode with a deleted session reference tried to prolongate a session', logContext)
        throw httpError(401, 'Session interrompue')
      }
    }
  } else {
    if (serverSessionInfo && user.id !== '_superadmin') {
      if (serverSessionInfo.user !== user.id) {
        await logout(req, res)
        eventsLog.info('sd.auth.keepalive.fail', 'a user with another user\'s exchange token tried to prolongate a session', logContext)
        throw httpError(401, 'Informations de session manquantes')
      }
      const serverSession = user.sessions?.find(s => s.id === serverSessionInfo.session)
      if (!serverSession) {
        await logout(req, res)
        eventsLog.info('sd.auth.keepalive.fail', 'a user with a deleted session reference tried to prolongate a session', logContext)
        throw httpError(401, 'Session interrompue')
      }
    }
  }
  const serverSessionId = serverSessionInfo ? serverSessionInfo.session : null

  const site = await reqSite(req)
  const payload = getTokenPayload(user, site)
  if (sessionState.user.isAdmin && sessionState.user.adminMode && !removeAdminMode) payload.adminMode = 1
  if (sessionState.user.rememberMe) payload.rememberMe = 1
  if (sessionState.user.asAdmin) {
    payload.asAdmin = sessionState.user.asAdmin
    payload.name = sessionState.user.name
    delete payload.isAdmin
  } else {
    if (!storage.readonly) {
      storage.updateLogged(sessionState.user.id, serverSessionId).catch(async (err: any) => {
        internalError('update-logged', 'error while updating logged date', err)
      })
    }
  }
  let userOrg
  if (idTokenOrg) {
    userOrg = user.organizations.find(o => o.id === idTokenOrg && (o.department || null) === (idTokenDep ? decodeURIComponent(idTokenDep) : null))
  }
  await setSessionCookies(req, res, payload, serverSessionId, userOrg)

  eventsLog.info('sd.auth.keepalive.ok', 'a session was successfully prolongated', logContext)
}

// after validating auth (password, passwordless or oaut), we prepare a redirect to /token_callback
// this redirect is potentially on another domain, and it will do the actual set cookies with session tokens
export const prepareCallbackUrl = async (req: Request, payload: any, redirect?: string, userOrg?:Pick<OrganizationMembership, 'id' | 'department'>, orgStorage?: boolean) => {
  redirect = redirect || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory/me'
  const redirectUrl = new URL(redirect)
  const redirectSite = await getRedirectSite(req, redirect)
  const token = await signToken({ ...payload, temporary: true }, config.jwtDurations.initialToken)
  const redirectBase = redirectSite ? (redirectUrl.protocol + redirectSite.host + (redirectSite.path ?? '') + '/simple-directory') : config.publicUrl
  const tokenCallback = redirectBase + '/api/auth/token_callback'
  const tokenCallbackUrl = new URL(tokenCallback)
  tokenCallbackUrl.searchParams.set('id_token', token)
  if (redirect) tokenCallbackUrl.searchParams.set('redirect', redirect)
  if (userOrg) {
    tokenCallbackUrl.searchParams.set('id_token_org', userOrg.id)
    if (userOrg.department) tokenCallbackUrl.searchParams.set('id_token_dep', userOrg.department)
  }
  if (orgStorage) tokenCallbackUrl.searchParams.set('org_storage', 'true')
  return tokenCallbackUrl
}
