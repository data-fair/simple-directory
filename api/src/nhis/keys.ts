import { createLocalJWKSet, createRemoteJWKSet, type JWTVerifyGetKey } from 'jose'
import axios from '@data-fair/lib-node/axios.js'
import { httpError } from '@data-fair/lib-express'
import memoize from 'memoizee'
import config from '#config'

// hostname-level SSRF guard for admin-provided issuer URLs (DNS rebinding is out of scope;
// private clusters are expected to use inline jwks instead of discovery)
const privateHostRe = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\]|0\.)/
const assertSafeIssuer = (issuer: string) => {
  const url = new URL(issuer)
  if (config.nhisAllowInsecureIssuers) return
  if (url.protocol !== 'https:') throw httpError(400, 'issuer must be https')
  if (privateHostRe.test(url.hostname)) throw httpError(400, 'issuer host is not allowed')
}

const getJwksUri = memoize(async (issuer: string) => {
  const discoveryUrl = issuer.replace(/\/$/, '') + '/.well-known/openid-configuration'
  const discovery = (await axios.get(discoveryUrl, { timeout: 5000 })).data
  if (typeof discovery?.jwks_uri !== 'string') throw httpError(400, 'issuer discovery has no jwks_uri')
  return discovery.jwks_uri
}, { promise: true, maxAge: 10 * 60 * 1000 })

const remoteJwks: Record<string, JWTVerifyGetKey> = {}

export const getKeyResolver = async (provider: { issuer: string, jwks?: any }): Promise<JWTVerifyGetKey> => {
  if (provider.jwks) return createLocalJWKSet(provider.jwks)
  assertSafeIssuer(provider.issuer)
  const jwksUri = await getJwksUri(provider.issuer)
  assertSafeIssuer(jwksUri)
  // createRemoteJWKSet caches keys and refetches on unknown kid with a cooldown
  return (remoteJwks[jwksUri] ??= createRemoteJWKSet(new URL(jwksUri)))
}
