import type { User } from '#types'
import type { Request, Response } from 'express'
import { reqSession, httpError, reqSiteUrl, type OrganizationMembership, type SessionState } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import { internalError } from '@data-fair/lib-node/observer.js'
import config from '#config'
import jwt, { type SignOptions, type JwtPayload } from 'jsonwebtoken'
import Cookies from 'cookies'
import storages from '#storages'
import { getSignatureKeys } from './keys-manager.ts'
import { reqSite } from '../sites/service.ts'

export const sign = async (payload: any, expiresIn: string, notBefore?: string) => {
  const signatureKeys = await getSignatureKeys()
  const webKey = signatureKeys.webKeys[0]
  const params: SignOptions = {
    algorithm: webKey.alg,
    keyid: webKey.kid,
    expiresIn
  }
  if (notBefore) params.notBefore = notBefore
  return jwt.sign(payload, signatureKeys.privateKey, params)
}

export const decode = (token: string) => jwt.decode(token) as JwtPayload

export const getPayload = (user: Omit<User, 'created' | 'updated'>) => {
  const payload: SessionState['user'] = {
    id: user.id,
    email: user.email,
    name: user.name,
    organizations: (user.organizations || []).map(o => ({ ...o }))
  }
  if (config.admins.includes(user.email) || (config.adminCredentials?.password && config.adminCredentials?.email === user.email)) {
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

export const unsetCookies = (req: Request, res: Response) => {
  const cookies = new Cookies(req, res)
  // use '' instead of null because instant cookie expiration is not properly applied on all safari versions
  cookies.set('id_token', '')
  cookies.set('id_token_sign', '')
  cookies.set('id_token_org', '')
  cookies.set('id_token_dep', '')
}

// Split JWT strategy, the signature is in a httpOnly cookie for XSS prevention
// the header and payload are not httpOnly to be readable by client
// all cookies use sameSite for CSRF prevention
export const setCookieToken = (req: Request, res: Response, token: string, userOrg?: OrganizationMembership) => {
  const cookies = new Cookies(req, res)
  const payload = decode(token)
  const parts = token.split('.')
  const opts: Cookies.SetOption = { sameSite: 'lax' }
  if (payload.rememberMe && payload.exp) opts.expires = new Date(payload.exp * 1000)
  cookies.set('id_token', parts[0] + '.' + parts[1], { ...opts, httpOnly: false })
  cookies.set('id_token_sign', parts[2], { ...opts, httpOnly: true })
  // set the same params to id_token_org cookie so that it doesn't expire before the rest
  if (userOrg) {
    cookies.set('id_token_org', userOrg.id, { ...opts, httpOnly: false })
    if (userOrg.department) cookies.set('id_token_dep', userOrg.department, { ...opts, httpOnly: false })
  }
}

export const keepalive = async (req: Request, res: Response, _user?: User) => {
  const session = reqSession(req)
  if (!session.account || !session.user) throw httpError(401)
  const logContext: EventLogContext = { req, account: (await reqSite(req))?.owner }

  // User may have new organizations since last renew
  let org
  if (session.organization) {
    org = await storages.globalStorage.getOrganization(session.organization.id)
    if (!org) {
      unsetCookies(req, res)
      eventsLog.info('sd.auth.keepalive.fail', 'a user tried to prolongate a session in invalid org', logContext)
      return res.status(401).send('Organisation inexistante')
    }
    logContext.account = { type: 'organization', id: org.id, name: org.name, department: session.organization.department, departmentName: session.organization.departmentName }
  }
  let storage = storages.globalStorage
  if (session.user.os && org) {
    storage = await storages.createOrgStorage(org) ?? storage
  }
  const user = _user || await storage.getUser(session.user.id)
  if (!user) {
    unsetCookies(req, res)
    eventsLog.info('sd.auth.keepalive.fail', 'a delete user tried to prolongate a session', logContext)
    return res.status(401).send('Utilisateur inexistant')
  }

  const payload = getPayload(user)
  if (session.user.isAdmin && session.user.adminMode && req.query.noAdmin !== 'true') payload.adminMode = 1
  if (session.user.rememberMe) payload.rememberMe = true
  if (session.user.asAdmin) {
    payload.asAdmin = session.user.asAdmin
    payload.name = session.user.name
    delete payload.isAdmin
  } else {
    if (!storage.readonly) {
      storage.updateLogged(session.user.id).catch(async (err: any) => {
        internalError('update-logged', 'error while updating logged date', err)
      })
    }
  }
  const token = await sign(payload, config.jwtDurations.exchangedToken)
  const cookies = new Cookies(req, res)
  const idTokenOrg = cookies.get('id_token_org')
  const idTokenDep = cookies.get('id_token_dep')
  let userOrg
  if (idTokenOrg) {
    userOrg = user.organizations.find(o => o.id === idTokenOrg && (o.department || null) === (idTokenDep ? decodeURIComponent(idTokenDep) : null))
  }
  setCookieToken(req, res, token, userOrg)

  eventsLog.info('sd.auth.keepalive.ok', 'a session was successfully prolongated', logContext)
}

// after validating auth (password, passwordless or oaut), we prepare a redirect to /token_callback
// this redirect is potentially on another domain, and it will do the actual set cookies with session tokens
export const prepareCallbackUrl = async (req: Request, payload: any, redirect?: string, userOrg?:Pick<OrganizationMembership, 'id' | 'department'>, orgStorage?: boolean) => {
  redirect = redirect || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory/me'
  const redirectUrl = new URL(redirect)
  const token = await sign({ ...payload, temporary: true }, config.jwtDurations.initialToken)
  // TODO: properly manage site on subpath here
  const tokenCallback = redirectUrl.origin + '/simple-directory/api/auth/token_callback'
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
