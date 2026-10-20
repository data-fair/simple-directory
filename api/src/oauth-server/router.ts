import express, { Router, type Request, type Response } from 'express'
import { decodeJwt } from 'jose'
import config from '#config'
import { reqIp, reqIsInternal, reqSiteUrl } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { reqI18n } from '#i18n'
import { consumeNhiLimits } from '../nhis/exchange.ts'
import { tokenLimits } from './clients.ts'
import { reqSite } from '../sites/service.ts'
import { issuerOfSite } from './issuers.ts'
import { getProvider } from './providers.ts'
import { handleJwtBearerGrant, jwtBearerGrantType, oauthError } from './jwt-bearer.ts'
import { errors } from 'oidc-provider'
import type Provider from 'oidc-provider'
import limiter from '../utils/limiter.ts'
import { normalizeDynamicMetadata } from './dynamic-clients.ts'

const router = Router()
export default router

const callbacks = new WeakMap<Provider, ReturnType<Provider['callback']>>()
const providerCallback = (provider: Provider) => {
  let callback = callbacks.get(provider)
  if (!callback) {
    callback = provider.callback()
    callbacks.set(provider, callback)
  }
  return callback
}

// the provider accepts an already parsed body, so the token endpoint is parsed once here
const tokenBodyParser = express.urlencoded({ limit: '56kb', extended: false })

const openidDiscovery = '/.well-known/openid-configuration'
const oauthDiscovery = '/.well-known/oauth-authorization-server'

// the provider derives its mount path from the prefix of originalUrl in front of url, the site
// middleware stripped the site path and service prefix from url: rebuild originalUrl from the issuer
// path so endpoints are always issuer + route (also after the discovery rewrite)
export const providerOriginalUrl = (issuer: string, url: string) => new URL(issuer).pathname.replace(/\/+$/, '') + url

// canonical form expected by issuerOfSite: origin + path without trailing slash
export const canonicalSiteUrl = (siteUrl: string) => {
  const url = new URL(siteUrl)
  return url.origin + url.pathname.replace(/\/+$/, '')
}

// rate limiting key of a token request, before any verification: the unverified sub of the client
// assertion (private_key_jwt), or the client_id parameter (public clients)
const tokenRequestClientId = (body: Record<string, any>): string | undefined => {
  if (typeof body.client_assertion === 'string') {
    try {
      const sub = decodeJwt(body.client_assertion).sub
      if (typeof sub === 'string' && sub) return sub
    } catch {}
  }
  if (typeof body.client_id === 'string' && body.client_id) return body.client_id
}

// the grants of the provider that are rate limited per IP and per client
const limitedGrantTypes = ['client_credentials', 'authorization_code', 'refresh_token']

// same budget as the JWT bearer grant: consumed up front, refunded once the token is issued (by the
// provider middleware, see providers.ts), so only failures count
const limitTokenRequest = async (req: Request, res: Response, grantType: string): Promise<boolean> => {
  const clientIp = reqIp(req)
  const clientId = tokenRequestClientId(req.body)
  let ipKey = clientIp
  let clientKey = clientId
  // the code and refresh grants of public clients have their own namespace: routine failures (a
  // grant that ended, an idle refresh token, a lost membership) of many users behind one address
  // must not lock that address out of password login, 2FA or the NHI exchange (raw address key).
  // The client_id of a public client is public (a dashboard ships it in its code): limited per
  // address too, or anyone could lock out every user of the client. Whatever the request claims
  // about its authentication (an unverified client_assertion proves nothing here), these grants
  // are keyed so; only client_credentials (an NHI, single owner) keeps M1's keys.
  if (grantType !== 'client_credentials') {
    ipKey = 'oauth-token-ip:' + clientIp
    clientKey = clientId === undefined ? undefined : `oauth-token-client:${clientId} ${clientIp}`
  }
  if (!await consumeNhiLimits(ipKey, clientKey)) {
    if (grantType === 'client_credentials') eventsLog.warn('sd.auth.nhi.rate-limit', 'rate limit error for the client_credentials grant', { req })
    else eventsLog.warn('sd.oauth.rate-limit', `rate limit error for the ${grantType} grant of client ${clientId ?? 'unknown'}`, { req })
    oauthError(res, 429, 'invalid_request', reqI18n(req).messages.errors.rateLimitAuth)
    return false
  }
  tokenLimits.set(req, { ipKey, clientKey, clientId })
  return true
}

// the registration body is parsed here (the dispatcher skips the global JSON parser) so that SD's
// rules apply before the provider sees it
const registrationBodyParser = express.json({ limit: '56kb', strict: false })

// open registration: every attempt counts (never refunded), then SD's rules for dynamic clients.
// The provider then validates the rest and stores the client.
const preRegistration = async (req: Request, res: Response): Promise<boolean> => {
  const clientIp = reqIp(req)
  if (!await limiter()('oauth-dcr:' + clientIp)) {
    eventsLog.warn('sd.oauth.rate-limit', 'rate limit error for the dynamic client registration', { req })
    oauthError(res, 429, 'invalid_request', reqI18n(req).messages.errors.rateLimitAuth)
    return false
  }
  if (!req.is('application/json')) {
    oauthError(res, 400, 'invalid_request', 'only application/json bodies are accepted')
    return false
  }
  try {
    await new Promise<void>((resolve, reject) => registrationBodyParser(req, res, err => err ? reject(err) : resolve()))
  } catch {
    oauthError(res, 400, 'invalid_request', 'failed to parse the request body')
    return false
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    oauthError(res, 400, 'invalid_request', 'client registration request must be a JSON object')
    return false
  }
  try {
    req.body = normalizeDynamicMetadata(req.body)
  } catch (err: any) {
    if (err instanceof errors.OIDCProviderError) {
      oauthError(res, err.statusCode, err.error, err.error_description)
      return false
    }
    throw err
  }
  return true
}

const tokenRoute = '/api/oauth/token'
const authorizeRoute = '/api/oauth/authorize'
const revocationRoute = '/api/oauth/revoke'
const registrationRoute = '/api/oauth/register'
// uids of the provider's interactions (nanoid, 43 characters of the url alphabet)
const uidPattern = '[A-Za-z0-9_-]{43}'
// the provider's resume of an interaction
const resumeRoute = new RegExp(`^${authorizeRoute}/${uidPattern}$`)
// SD's interaction routes (interaction.ts), mounted after the session middleware
const interactionRoute = new RegExp(`^/api/oauth/interaction/${uidPattern}(/details)?$`)

// the provider's own router is case insensitive and accepts trailing slashes: only the exact
// canonical spelling of a served route is forwarded, so that the checks below cannot be skipped
// through a variant (the provider's jwks route is not served, the advertised jwks_uri is SD's
// scoped jwks)
const isServedRoute = (path: string) => {
  if ([tokenRoute, openidDiscovery, oauthDiscovery].includes(path)) return true
  if (!config.oauthServer?.authorizationCode) return false
  if (path === registrationRoute) return !!config.oauthServer.dynamicClients
  return path === authorizeRoute || path === revocationRoute || resumeRoute.test(path)
}

router.use(async (req, res, next) => {
  const path = req.path
  const normalizedPath = path.toLowerCase().replace(/\/+$/, '')
  if (!normalizedPath.startsWith('/api/oauth/') && normalizedPath !== openidDiscovery && normalizedPath !== oauthDiscovery) return next()
  // internal calls carry no site context, the authorization server is only served publicly
  if (reqIsInternal(req)) return res.status(404).send()
  if (!config.oauthServer?.enabled) return res.status(404).send()
  // the interaction routes read the SD session, they are handled further down the app
  if (config.oauthServer.authorizationCode && interactionRoute.test(path)) return next()
  if (!isServedRoute(path)) return res.status(404).send()

  const ctx = await issuerOfSite(await reqSite(req), canonicalSiteUrl(reqSiteUrl(req)))
  if (!ctx) return res.status(404).send()
  if (path === tokenRoute && req.method === 'POST') {
    await new Promise<void>((resolve, reject) => tokenBodyParser(req, res, err => err ? reject(err) : resolve()))
    if (req.body?.grant_type === jwtBearerGrantType) return handleJwtBearerGrant(req, res, ctx)
    const grantType = req.body?.grant_type
    if (limitedGrantTypes.includes(grantType) && !await limitTokenRequest(req, res, grantType)) return
  }

  if (path === registrationRoute) {
    // registration management is off, only the creation is served
    if (req.method !== 'POST') return res.status(404).send()
    if (!await preRegistration(req, res)) return
  }

  const provider = await getProvider(ctx)

  if (path === oauthDiscovery) req.url = openidDiscovery + req.url.slice(oauthDiscovery.length)
  req.originalUrl = providerOriginalUrl(ctx.issuer, req.url)
  await providerCallback(provider)(req, res)
})
