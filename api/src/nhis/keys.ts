import { createLocalJWKSet, createRemoteJWKSet, type JWTVerifyGetKey } from 'jose'
import axios from '@data-fair/lib-node/axios.js'
import { httpError } from '@data-fair/lib-express'
import memoize from 'memoizee'
import { BlockList, isIP } from 'node:net'
import config from '#config'

// hostname-level SSRF guard for admin-provided issuer URLs (DNS rebinding is out of scope;
// private clusters are expected to use inline jwks instead of discovery).
// node:net's BlockList understands IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1,
// including its canonical hex form ::ffff:7f00:1) and checks them against the ipv4
// subnets below, so no manual v4-in-v6 extraction is needed.
const privateHosts = new BlockList()
for (const [addr, prefix] of [
  ['127.0.0.0', 8], ['10.0.0.0', 8], ['172.16.0.0', 12], ['192.168.0.0', 16],
  ['169.254.0.0', 16], ['0.0.0.0', 8], ['100.64.0.0', 10]
] as const) privateHosts.addSubnet(addr, prefix, 'ipv4')
for (const [addr, prefix] of [
  ['::1', 128], ['fc00::', 7], ['fe80::', 10]
] as const) privateHosts.addSubnet(addr, prefix, 'ipv6')

const isPrivateHost = (hostname: string): boolean => {
  const bare = hostname.replace(/^\[|\]$/g, '') // URL.hostname keeps IPv6 brackets
  const family = isIP(bare)
  if (family === 4) return privateHosts.check(bare, 'ipv4')
  if (family === 6) return privateHosts.check(bare, 'ipv6')
  return bare === 'localhost' || bare.endsWith('.localhost')
}

export const assertSafeIssuer = (issuer: string) => {
  let url: URL
  try {
    url = new URL(issuer)
  } catch {
    throw httpError(400, 'invalid issuer url')
  }
  if (config.nhisAllowInsecureIssuers) return
  if (url.protocol !== 'https:') throw httpError(400, 'issuer must be https')
  // WHATWG URL parsing already canonicalizes alternate IPv4 encodings (hex/octal/decimal)
  // into dotted-decimal form, so checking the parsed hostname is sufficient here.
  if (isPrivateHost(url.hostname)) throw httpError(400, 'issuer host is not allowed')
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
