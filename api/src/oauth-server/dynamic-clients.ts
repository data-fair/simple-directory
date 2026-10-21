// Dynamic clients of the authorization server (MCP and other agents): client id metadata documents
// (CIMD, fetched by the provider, cached in its LRU, never stored) and dynamic client registration
// (DCR, stored in the oauth-client collection, scoped to the issuer). Both follow the same rules.
// A dynamic client's grant is always bound to an NHI, chosen at the consent of an org admin.
import { isIP } from 'node:net'
import { AsyncLocalStorage } from 'node:async_hooks'
import { errors } from 'oidc-provider'
import type Provider from 'oidc-provider'
import type { KoaContextWithOIDC } from 'oidc-provider'
import { publicLookup, checkAddress, getSsrfRules } from '@data-fair/lib-node/ssrf.js'
import { reqIp } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import mongo from '#mongo'
import limiter from '../utils/limiter.ts'
import { isLoopbackRedirectUri, loopbackHosts } from './clients.ts'
import { listGrantRecords } from './grants.ts'
import Debug from 'debug'
import { internalError } from '@data-fair/lib-node/observer.js'

const debug = Debug('oauth-server')

const allowedAuthMethods = ['none', 'private_key_jwt']
const allowedGrantTypes = ['authorization_code', 'refresh_token']
const allowedResponseTypes = ['code']
const webUriKeys = ['logo_uri', 'client_uri', 'policy_uri', 'tos_uri', 'jwks_uri']
const forbiddenSchemes = new Set(['javascript:', 'data:', 'file:', 'vbscript:', 'blob:', 'about:'])
// RFC 8252 7.1: a private-use scheme is a reverse domain name, so it contains a dot
const privateUseScheme = /^[a-z][a-z0-9+-]*\.[a-z0-9+.-]+:$/

// https matched exactly, loopback http matched exactly except for the port (native clients only),
// private-use schemes matched exactly
export const dynamicRedirectUriAllowed = (uri: string): boolean => {
  if (typeof uri !== 'string' || uri.includes('#')) return false
  const url = URL.parse(uri)
  if (!url || url.username || url.password) return false
  if (url.protocol === 'https:') return !loopbackHosts.has(url.hostname)
  if (url.protocol === 'http:') return isLoopbackRedirectUri(uri)
  if (forbiddenSchemes.has(url.protocol)) return false
  return privateUseScheme.test(url.protocol)
}

const stringArray = (value: unknown, key: string): string[] => {
  if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) throw new errors.InvalidClientMetadata(`${key} must be an array of strings`)
  return value
}

// SD's rules for a DCR body or a CIMD document, run by the provider's extraClientMetadata.validator
// on its own schema instance (configuration.ts): checks in place and sets application_type. Throws
// the provider's errors (invalid_client_metadata, invalid_redirect_uri).
export const checkDynamicMetadata = (metadata: Record<string, any>) => {
  // validated by an outbound fetch: an open registration must not make SD call arbitrary urls
  if (metadata.sector_identifier_uri !== undefined) throw new errors.InvalidClientMetadata('sector_identifier_uri is not supported')

  metadata.token_endpoint_auth_method ??= 'none'
  if (!allowedAuthMethods.includes(metadata.token_endpoint_auth_method)) {
    throw new errors.InvalidClientMetadata(`token_endpoint_auth_method must be one of ${allowedAuthMethods.join(', ')}`)
  }
  metadata.grant_types ??= [...allowedGrantTypes]
  if (!stringArray(metadata.grant_types, 'grant_types').every(g => allowedGrantTypes.includes(g))) {
    throw new errors.InvalidClientMetadata(`grant_types can only contain ${allowedGrantTypes.join(', ')}`)
  }
  metadata.response_types ??= [...allowedResponseTypes]
  if (!stringArray(metadata.response_types, 'response_types').every(r => allowedResponseTypes.includes(r))) {
    throw new errors.InvalidClientMetadata(`response_types can only contain ${allowedResponseTypes.join(', ')}`)
  }
  // shown on the consent screen or fetched: https only, as the provider requires of CIMD documents
  for (const key of webUriKeys) {
    const value = metadata[key]
    if (value !== undefined && (typeof value !== 'string' || URL.parse(value)?.protocol !== 'https:')) {
      throw new errors.InvalidClientMetadata(`${key} must be an https url`)
    }
  }

  const redirectUris = metadata.redirect_uris
  if (!Array.isArray(redirectUris) || !redirectUris.length) throw new errors.InvalidRedirectUri('redirect_uris must be a non empty array')
  for (const uri of redirectUris) {
    if (!dynamicRedirectUriAllowed(uri)) throw new errors.InvalidRedirectUri(`redirect uri not allowed for a dynamic client: ${String(uri)}`)
  }
  // the provider ignores the port of a loopback redirect uri only for native clients (RFC 8252
  // 7.3), and for all of their redirect uris: only an all-loopback client gets it. Private-use
  // schemes require a native client, so they cannot be mixed with loopback uris.
  const loopbacks = redirectUris.filter(isLoopbackRedirectUri).length
  const privateUse = redirectUris.filter(uri => URL.parse(uri)?.protocol !== 'https:' && !isLoopbackRedirectUri(uri)).length
  if (loopbacks && privateUse) throw new errors.InvalidRedirectUri('loopback redirect uris cannot be mixed with private-use scheme ones')
  metadata.application_type = loopbacks === redirectUris.length || privateUse ? 'native' : 'web'
}

// the rate limiting key of CIMD fetches started outside the provider's own request handling (SD's
// interaction routes): the provider then hands allowFetch no context
const cimdFetchKey = new AsyncLocalStorage<string>()

// the provider's client lookup, with the CIMD fetches it may start counted against limiterKey
export const findDynamicClient = (provider: Provider, clientId: string, limiterKey: string) =>
  cimdFetchKey.run(limiterKey, () => provider.Client.find(clientId))

// features.clientIdMetadataDocument.allowFetch, called on cache misses only: every fetch counts
// against the address of the request, or the key of findDynamicClient (never refunded), so SD
// cannot be used to send GET requests in bulk to arbitrary https urls
export const allowFetch = async (koaCtx: KoaContextWithOIDC | undefined) => {
  const key = koaCtx?.req ? reqIp(koaCtx.req as any) : cimdFetchKey.getStore()
  if (!key) return false
  if (await limiter()('oauth-cimd:' + key)) return true
  eventsLog.warn('sd.oauth.rate-limit', 'rate limit error for client id metadata document fetches', { req: koaCtx?.req as any })
  return false
}

// a client chosen value in a log line or on the consent screen: no control characters, and no bidi
// controls or zero-width characters that could make it display as something else
export const logSafeName = (name: unknown) => {
  if (typeof name !== 'string' || !name) return 'unnamed'
  // eslint-disable-next-line no-control-regex
  return name.replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g, '').slice(0, 100)
}

// the id url of a CIMD client as shown on the consent screen: the WHATWG serialization punycodes
// the host and percent-encodes the rest, so a lookalike host shows as what it is
export const displayIdUrl = (clientId: string) => new URL(clientId).href

// documents served from memory by the test environment (POST /api/test-env/cimd-fixtures), consulted
// only when ENABLE_TEST_API=1
export const cimdFixtures = new Map<string, Record<string, any>>()

// Node's bundled undici (the one behind the global fetch): the same lookup oidc-provider does for
// its own dispatcher, no undici dependency of our own to keep in line with Node's
let ssrfAgent: any
let missingAgentLogged = false
const getSsrfAgent = () => {
  if (!ssrfAgent) {
    // reading the global loads the bundled undici, which registers its global dispatcher
    if (typeof Response !== 'function') throw new Error('fetch is not available')
    const Agent = ((globalThis as any)[Symbol.for('undici.globalDispatcher.2')] ?? (globalThis as any)[Symbol.for('undici.globalDispatcher.1')])?.constructor
    if (Agent?.name !== 'Agent') {
      // fails closed (a proxy dispatcher, NODE_USE_ENV_PROXY...): every CIMD and jwks_uri fetch
      // fails, which the provider only reports as a fetch error to the client
      const err = new Error('cannot create the SSRF safe dispatcher of the oauth server, the global dispatcher is a ' + (Agent?.name ?? 'missing'))
      if (!missingAgentLogged) {
        missingAgentLogged = true
        internalError('oauth-ssrf-dispatcher', 'client id metadata documents cannot be fetched', err)
      }
      throw err
    }
    // publicLookup refuses non public addresses (SSRF_PUBLIC_IPS / SSRF_PRIVATE_IPS apply)
    ssrfAgent = new Agent({ connect: { lookup: publicLookup } })
  }
  return ssrfAgent
}

// the provider's fetch option: its dispatcher is replaced by lib-node's SSRF rules, its timeout
// signal is kept and redirections are never followed. The provider applies its own body limits
// (fetchResponseBodyLimits) and validates CIMD documents (checkDynamicMetadata).
export const ssrfFetch = async (url: string | URL, options: RequestInit & { dispatcher?: unknown }): Promise<Response> => {
  const href = String(url)
  if (process.env.ENABLE_TEST_API === '1' && cimdFixtures.has(href)) {
    return new Response(JSON.stringify(cimdFixtures.get(href)), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const target = new URL(href)
  if (target.protocol !== 'https:') throw new Error('only https urls are fetched')
  // node does not call the lookup for ip literals
  const host = target.hostname.replace(/^\[(.*)\]$/, '$1')
  if (isIP(host)) {
    const ssrfError = checkAddress(host, undefined, getSsrfRules())
    if (ssrfError) throw ssrfError
  }
  const { dispatcher: _providerDispatcher, ...rest } = options
  return await fetch(href, { ...rest, redirect: 'manual', dispatcher: getSsrfAgent() } as RequestInit)
}

const unusedClientAge = 30 * 86400 * 1000

// registered clients that never obtained a grant are deleted after 30 days
export const cleanupDynamicClients = async (): Promise<number> => {
  const clients = mongo.db.collection<{ _id: string, createdAt?: Date }>('oauth-client')
  const old = await clients.find({ createdAt: { $lt: new Date(Date.now() - unusedClientAge) } }, { projection: { _id: 1 } }).toArray()
  let count = 0
  for (const { _id } of old) {
    if ((await listGrantRecords({ clientId: _id })).length) continue
    await clients.deleteOne({ _id })
    count++
  }
  if (count) debug(`deleted ${count} unused dynamic clients`)
  return count
}
