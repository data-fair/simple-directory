import axios from '@data-fair/lib-node/axios.js'
import type { OpenIDConnect } from '../../config/type/index.ts'
import { type OAuthProvider, type OAuthUserInfo } from './service.ts'
import mongo from '#mongo'
import Debug from 'debug'
import _slug from 'slugify'
import jwt from 'jsonwebtoken'
import { httpError } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'

const slug = _slug.default
const debug = Debug('oauth')

export const getOidcProviderId = (url: string) => {
  let host = url
  try {
    host = new URL(url).host
  } catch (err) {
    console.warn('invalide oauth provider url', url)
  }
  return slug(host, { lower: true, strict: true })
}

export async function completeOidcProvider (p: OpenIDConnect): Promise<OAuthProvider> {
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
  const userInfo = async (accessToken: string, idToken?:string, logContext?: EventLogContext) => {
    let claims
    if (!p.userInfoSource || p.userInfoSource === 'auto') {
      if (discoveryContent.userinfo_endpoint) {
        debug('read claims from userinfo_endpoint')
        claims = (await axios.get(discoveryContent.userinfo_endpoint, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })).data
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
      // site-scoped user records, `allowSuperadmin` opt-in, main-site-only
      // `adminMode`, and `config.admins` change-host protection. If any of
      // those guarantees is weakened, revisit this check before relaxing them.
      if (logContext) {
        const emailDomain = typeof claims.email === 'string' ? claims.email.split('@')[1] : null
        eventsLog.alert(
          'sd.oidc.email-not-verified',
          `OIDC login refused: provider=${id} emailVerified=${JSON.stringify(claims.email_verified)} emailDomain=${emailDomain}`,
          logContext
        )
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
    scope: 'openid email profile',
    auth,
    userInfo
  }
}
