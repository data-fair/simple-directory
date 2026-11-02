import { axiosInstance, privateAxiosInstance } from '@data-fair/lib-node/axios.js'
import type { OpenIDConnect } from '../../config/type/index.ts'
import { type OAuthProvider, type OAuthUserInfo } from './service.ts'
import mongo from '#mongo'
import Debug from 'debug'
import _slug from 'slugify'
import jwt from 'jsonwebtoken'
import { httpError } from '@data-fair/lib-express'
import log from '@data-fair/lib-node/log.js'
import type { LogFields } from '../utils/log-fields.ts'
import { decipher, type CipheredContent } from '../utils/cipher.ts'
import { verifyProviderJwt, OidcValidationError, type ProviderJwtContext } from './oidc-jwt.ts'

const slug = _slug.default
const debug = Debug('oauth')

export const getOidcProviderId = (url: string) => {
  let host = url
  try {
    host = new URL(url).host
  } catch (err) {
    log.warn('invalid oauth provider url ' + url, { code: 'oauth-provider-url' })
  }
  return slug(host, { lower: true, strict: true })
}

// the userinfo endpoint answers in JSON, or with a JWT when the client registration asks for a signed
// response (application/jwt, cf OIDC Core 5.3.2, the default of ProConnect). The JWT is decoded without
// checking its signature, like the id_token: both come from a back channel request to the provider.
export const parseUserInfoResponse = (body: string, contentType?: string): Record<string, any> | undefined => {
  // an unreadable response returns undefined, userInfo then falls back to the id_token claims
  if (contentType?.startsWith('application/jwt')) {
    const claims = jwt.decode(body.trim())
    return claims && typeof claims === 'object' ? claims : undefined
  }
  try {
    const claims = JSON.parse(body)
    return claims && typeof claims === 'object' ? claims : undefined
  } catch {
    return undefined
  }
}

export const resolveAuthorizationMethod = (configured: 'header' | 'body' | undefined, supported?: string[]): 'header' | 'body' => {
  if (configured) return configured
  if (supported?.includes('client_secret_post') && !supported.includes('client_secret_basic')) return 'body'
  return 'header'
}

const DISCOVERY_TTL = 24 * 3600 * 1000

export const discoveryStale = (fetchedAt: Date | undefined, now = new Date()): boolean => {
  return !fetchedAt || now.getTime() - fetchedAt.getTime() > DISCOVERY_TTL
}

// returns the cached discovery when fresh, refetches it when stale and keeps serving the stale copy
// if the provider is unreachable (an unreachable provider must not break logins for a cached discovery)
export async function refreshDiscovery (cached: { content: any, fetchedAt?: Date } | null, fetch: () => Promise<any>): Promise<{ content: any, fetchedAt: Date, refreshed: boolean }> {
  if (cached && !discoveryStale(cached.fetchedAt)) {
    return { content: cached.content, fetchedAt: cached.fetchedAt!, refreshed: false }
  }
  try {
    return { content: await fetch(), fetchedAt: new Date(), refreshed: true }
  } catch (err) {
    if (!cached) throw err
    log.warn('failed to refresh the OIDC discovery, keeping the cached one', { code: 'sd.oidc.discovery-refresh-failed', err })
    return { content: cached.content, fetchedAt: cached.fetchedAt ?? new Date(0), refreshed: false }
  }
}

// strict providers refuse a login whose tokens fail validation (the error is rethrown, the callers turn
// it into a refusal), the others raise an alert and carry on with the unverified claims. The alert is
// emitted only for interactive requests (logFields given), like the email-not-verified alert.
export const applyOidcPolicy = (provider: Pick<OAuthProvider, 'id' | 'strict'>, err: OidcValidationError, logFields?: LogFields): void => {
  if (provider.strict) throw err
  if (logFields) {
    // the message may tell a provider outage (jwks fetch) from a bad signature: logged for ops, never shown to users
    log.alert(`OIDC validation failed on a non strict provider: provider=${provider.id} check=${err.check} message=${err.message}`, { code: 'sd.oidc.validation-failed', providerId: provider.id, check: err.check, ...logFields })
  }
}

// trusted: the provider comes from the operator's config (config.oidc.providers) and may live on
// a private network. Site-level providers are not trusted, their discovery and userinfo requests
// go through the public agents that refuse non public addresses (cf SSRF_PUBLIC_IPS).
export async function completeOidcProvider (p: OpenIDConnect, trusted = false): Promise<OAuthProvider> {
  const axios = trusted ? privateAxiosInstance : axiosInstance
  const id = getOidcProviderId(p.discovery)
  // use full discovery URL as cache key to avoid collision between providers
  // on the same host but different paths (e.g. Azure AD multi-tenant)
  const cacheKey = slug(p.discovery, { lower: true, strict: true })
  const cached = await mongo.oidcDiscovery.findOne({ _id: cacheKey })
  const { content: discoveryContent, fetchedAt, refreshed } = await refreshDiscovery(cached, async () => {
    const content = (await axios.get(p.discovery)).data
    debug(`Fetched OIDC discovery info from ${p.discovery}`, content)
    return content
  })
  if (refreshed) await mongo.oidcDiscovery.replaceOne({ _id: cacheKey }, { content: discoveryContent, fetchedAt }, { upsert: true })
  const tokenURL = new URL(discoveryContent.token_endpoint)
  const authURL = new URL(discoveryContent.authorization_endpoint)
  const auth = {
    tokenHost: tokenURL.origin,
    tokenPath: tokenURL.pathname,
    authorizeHost: authURL.origin,
    authorizePath: authURL.pathname
  }
  const strict = p.strict ?? !trusted
  const policyProvider = { id, strict }
  const jwtContext: ProviderJwtContext = {
    id,
    issuer: discoveryContent.issuer,
    jwksUri: discoveryContent.jwks_uri,
    clientId: p.client.id,
    clientSecret: decipher(p.client.secret as CipheredContent),
    trusted
  }

  // verified claims, or the decoded ones if the policy of the provider lets the failure through
  const validateIdToken = async (idToken: string, nonce?: string, logFields?: LogFields): Promise<Record<string, any>> => {
    try {
      return await verifyProviderJwt(jwtContext, idToken, { nonce, requireExp: true })
    } catch (err) {
      if (!(err instanceof OidcValidationError)) throw err
      applyOidcPolicy(policyProvider, err, logFields)
      return (jwt.decode(idToken) as Record<string, any> | null) ?? {}
    }
  }

  // OIDC Back-Channel Logout 1.0 §2.4. A non strict provider that fails the verification still honors the
  // legacy unsigned Keycloak shape (typ Logout and a sid), after the alert
  const validateLogoutToken = async (logoutToken: string, logFields?: LogFields): Promise<{ sid?: string, sub?: string }> => {
    try {
      const claims = await verifyProviderJwt(jwtContext, logoutToken, { requireExp: false })
      const event = claims.events?.['http://schemas.openid.net/event/backchannel-logout']
      if (!event || typeof event !== 'object' || Array.isArray(event)) throw new OidcValidationError('events', 'missing back-channel logout event')
      if ('nonce' in claims) throw new OidcValidationError('malformed', 'a logout token must not have a nonce')
      if (typeof claims.sid !== 'string' && typeof claims.sub !== 'string') throw new OidcValidationError('sub', 'a logout token needs a sid or a sub')
      return { sid: typeof claims.sid === 'string' ? claims.sid : undefined, sub: typeof claims.sub === 'string' ? claims.sub : undefined }
    } catch (err) {
      if (!(err instanceof OidcValidationError)) throw err
      applyOidcPolicy(policyProvider, err, logFields)
      const decoded = jwt.decode(logoutToken) as Record<string, any> | null
      if (decoded?.typ === 'Logout' && typeof decoded.sid === 'string') return { sid: decoded.sid }
      throw err
    }
  }

  // idTokenClaims: the claims returned by validateIdToken when the login produced an id_token
  const userInfo = async (accessToken: string, idToken?: string, logFields?: LogFields, idTokenClaims?: Record<string, any>) => {
    let claims
    const decodeIdToken = () => idTokenClaims ?? jwt.decode(idToken!) as any
    if (!p.userInfoSource || p.userInfoSource === 'auto') {
      if (discoveryContent.userinfo_endpoint) {
        debug('read claims from userinfo_endpoint')
        const res = await axios.get(discoveryContent.userinfo_endpoint, {
          headers: { Authorization: `Bearer ${accessToken}` },
          responseType: 'text'
        })
        const contentType = String(res.headers['content-type'] ?? '')
        claims = parseUserInfoResponse(res.data, contentType)
        try {
          if (claims && contentType.startsWith('application/jwt')) {
            claims = await verifyProviderJwt(jwtContext, String(res.data).trim(), { requireExp: false })
          }
        } catch (err) {
          if (!(err instanceof OidcValidationError)) throw err
          applyOidcPolicy(policyProvider, err, logFields)
        }
      }
      if (!claims?.email && idToken) {
        debug('fallback to reading claims from id_token')
        claims = decodeIdToken()
      }
      if (!claims?.email) {
        debug('fallback to reading claims from access_token')
        claims = jwt.decode(accessToken) as any
      }
    }
    if (p.userInfoSource === 'id_token' && idToken) {
      debug('read claims directly from id_token')
      claims = decodeIdToken()
      if (!claims) debug('failed to decode id_token as a JWT', idToken)
    }
    if (p.userInfoSource === 'access_token') {
      debug('read claims directly from access_token')
      claims = jwt.decode(accessToken) as any
      if (!claims) debug('failed to decode access_token as a JWT', accessToken)
    }
    debug('found claims', claims)
    // whatever the source (userinfo, access token...), the claims must be about the user the verified id_token was issued for
    if (claims && idTokenClaims && claims !== idTokenClaims && claims.sub !== idTokenClaims.sub) {
      applyOidcPolicy(policyProvider, new OidcValidationError('sub', 'the sub of the claims differs from the one of the id_token'), logFields)
    }
    if (!claims?.email) {
      throw httpError(400, 'Authentification refusée depuis le fournisseur. Pas d\'adresse email trouvée dans les informations utilisateur.')
    }
    if (claims.email_verified === false && !p.ignoreEmailVerified) {
      // Reject only when the IdP explicitly asserts the email is not verified.
      // Absent / null / non-boolean values are accepted because enterprise
      // directory-backed IdPs (Azure AD / Entra ID, corporate Keycloak fronting
      // LDAP/AD, ADFS) routinely omit the claim while treating the email as
      // verified by directory authority — a strict `=== true` check breaks
      // those integrations out of the box for a narrow residual win.
      // The residual risk (multi-tenant IdP emitting arbitrary emails, buggy
      // provider omitting an intended `false`) is contained by the structural
      // defenses in docs/architecture/email-trust-and-site-isolation.md:
      // site-scoped user records, standard-OAuth superadmin block, main-site-only
      // `adminMode`, and `config.admins` change-host protection. If any of
      // those guarantees is weakened, revisit this check before relaxing them.
      if (logFields) {
        const emailDomain = typeof claims.email === 'string' ? claims.email.split('@')[1] : null
        log.alert(`OIDC login refused: provider=${id} emailVerified=${JSON.stringify(claims.email_verified)} emailDomain=${emailDomain}`, { code: 'sd.oidc.email-not-verified', ...logFields })
      }
      throw httpError(400, 'Authentification refusée depuis le fournisseur. L\'adresse mail n\'est pas indiquée comme validée.')
    }
    const userInfo: OAuthUserInfo = {
      data: claims,
      user: {
        email: claims.email,
        avatarUrl: claims.picture
      },
      id: claims.sub
    }
    if (claims.given_name) {
      userInfo.user.firstName = claims.given_name
    }
    if (claims.family_name) {
      userInfo.user.lastName = claims.family_name
    } else if (claims.usual_name) {
      // ProConnect (French public sector) uses usual_name instead of family_name
      userInfo.user.lastName = claims.usual_name
    }
    if (claims.name) {
      userInfo.user.name = claims.name
    }
    return userInfo
  }

  return {
    ...p,
    id,
    type: 'oidc',
    oidc: true,
    trusted,
    clientId: p.client.id,
    issuer: discoveryContent.issuer,
    jwksUri: discoveryContent.jwks_uri,
    endSessionEndpoint: discoveryContent.end_session_endpoint,
    issParameterSupported: discoveryContent.authorization_response_iss_parameter_supported === true,
    strict,
    rpInitiatedLogout: p.rpInitiatedLogout ?? !trusted,
    authorizationMethod: resolveAuthorizationMethod(p.authorizationMethod, discoveryContent.token_endpoint_auth_methods_supported),
    scope: p.scope || 'openid email profile',
    auth,
    userInfo,
    validateIdToken,
    validateLogoutToken
  }
}
