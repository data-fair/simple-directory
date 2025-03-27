import axios from '@data-fair/lib-node/axios.js'
import type { OpenIDConnect } from '../../config/type/index.ts'
import { type OAuthProvider, type OAuthUserInfo } from './service.ts'
import mongo from '#mongo'
import Debug from 'debug'
import _slug from 'slugify'
import jwt from 'jsonwebtoken'

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
  let discoveryContent = (await mongo.oidcDiscovery.findOne({ _id: id }))?.content
  if (discoveryContent) {
    debug(`Read pre-fetched OIDC discovery info from db for provider ${id}`, discoveryContent)
  } else {
    discoveryContent = (await axios.get(p.discovery)).data
    debug(`Fetched OIDC discovery info from ${p.discovery}`, discoveryContent)
    await mongo.oidcDiscovery.insertOne({ _id: id, content: discoveryContent })
  }
  const tokenURL = new URL(discoveryContent.token_endpoint)
  const authURL = new URL(discoveryContent.authorization_endpoint)
  const auth = {
    tokenHost: tokenURL.origin,
    tokenPath: tokenURL.pathname,
    authorizeHost: authURL.origin,
    authorizePath: authURL.pathname
  }
  const userInfo = async (accessToken: string) => {
    let claims
    if (discoveryContent.userinfo_endpoint) {
      claims = (await axios.get(discoveryContent.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })).data
    } else {
      claims = jwt.decode(accessToken) as any
    }
    debug('fetch userInfo claims from oidc provider', claims)
    if (claims.email_verified === false && !p.ignoreEmailVerified) {
      throw new Error('Authentification refusée depuis le fournisseur. L\'adresse mail est indiquée comme non validée.')
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
