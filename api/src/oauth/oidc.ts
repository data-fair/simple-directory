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

// trusted: the provider comes from the operator's config (config.oidc.providers) and may live on
// a private network. Site-level providers are not trusted, their discovery and userinfo requests
// go through the public agents that refuse non public addresses (cf SSRF_PUBLIC_IPS).
export async function completeOidcProvider (p: OpenIDConnect, trusted = false): Promise<OAuthProvider> {
  const axios = trusted ? privateAxiosInstance : axiosInstance
  const id = getOidcProviderId(p.discovery)
  // use full discovery URL as cache key to avoid collision between providers
  // on the same host but different paths (e.g. Azure AD multi-tenant)
  const cacheKey = slug(p.discovery, { lower: true, strict: true })
  let discoveryContent = (await mongo.oidcDiscovery.findOne({ _id: cacheKey }))?.content
  if (discoveryContent) {
    debug(`Read pre-fetched OIDC discovery info from db for provider ${id}`, discoveryContent)
  } else {
    discoveryContent = (await axios.get(p.discovery)).data
    debug(`Fetched OIDC discovery info from ${p.discovery}`, discoveryContent)
    await mongo.oidcDiscovery.insertOne({ _id: cacheKey, content: discoveryContent })
  }
  const tokenURL = new URL(discoveryContent.token_endpoint)
  const authURL = new URL(discoveryContent.authorization_endpoint)
  const auth = {
    tokenHost: tokenURL.origin,
    tokenPath: tokenURL.pathname,
    authorizeHost: authURL.origin,
    authorizePath: authURL.pathname
  }
  const userInfo = async (accessToken: string, idToken?:string, logFields?: LogFields) => {
    let claims
    if (!p.userInfoSource || p.userInfoSource === 'auto') {
      if (discoveryContent.userinfo_endpoint) {
        debug('read claims from userinfo_endpoint')
        const res = await axios.get(discoveryContent.userinfo_endpoint, {
          headers: { Authorization: `Bearer ${accessToken}` },
          responseType: 'text'
        })
        claims = parseUserInfoResponse(res.data, String(res.headers['content-type'] ?? ''))
      }
      if (!claims?.email && idToken) {
        debug('fallback to reading claims from id_token')
        claims = jwt.decode(idToken) as any
      }
      if (!claims?.email) {
        debug('fallback to reading claims from access_token')
        claims = jwt.decode(accessToken) as any
      }
    }
    if (p.userInfoSource === 'id_token' && idToken) {
      debug('read claims directly from id_token')
      claims = jwt.decode(idToken) as any
      if (!claims) debug('failed to decode id_token as a JWT', idToken)
    }
    if (p.userInfoSource === 'access_token') {
      debug('read claims directly from access_token')
      claims = jwt.decode(accessToken) as any
      if (!claims) debug('failed to decode access_token as a JWT', accessToken)
    }
    debug('found claims', claims)
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
    scope: p.scope || 'openid email profile',
    auth,
    userInfo
  }
}
