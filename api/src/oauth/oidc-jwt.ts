// Verification of the JWTs issued by an OIDC provider (id_token, signed userinfo, logout token)
// against the keys of this provider. Verification only: the strict/alert policy belongs to the callers.
import { createLocalJWKSet, decodeProtectedHeader, jwtVerify, errors } from 'jose'
import type { JSONWebKeySet, JWTPayload } from 'jose'
import { axiosInstance, privateAxiosInstance } from '@data-fair/lib-node/axios.js'

export type OidcCheck = 'signature' | 'alg' | 'iss' | 'aud' | 'azp' | 'exp' | 'iat' | 'nonce' | 'sub' | 'events' | 'malformed'

export class OidcValidationError extends Error {
  check: OidcCheck
  constructor (check: OidcCheck, message?: string, options?: { cause?: unknown }) {
    super(message ?? `OIDC validation failed: ${check}`, options)
    this.name = 'OidcValidationError'
    this.check = check
  }
}

export type ProviderJwtContext = {
  id: string,
  issuer?: string,
  jwksUri?: string,
  clientId: string,
  /** already deciphered */
  clientSecret: string,
  trusted: boolean
}

const CLOCK_TOLERANCE = 60
const JWKS_TTL = 3600 * 1000
const FORCED_REFETCH_MIN_DELAY = 60 * 1000

const symmetricAlgs = ['HS256', 'HS384', 'HS512']
const asymmetricAlgs = ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512', 'ES256', 'ES384', 'ES512', 'EdDSA']

type JwksEntry = { jwks: ReturnType<typeof createLocalJWKSet>, fetchedAt: number, lastForcedRefetchAt: number }
const jwksCache = new Map<string, JwksEntry>()

export const clearJwksCache = (): void => { jwksCache.clear() }

export const expectedIssuer = (issuer: string, claims: Record<string, any>): string => {
  // Microsoft Entra publishes a templated issuer, the tenant being the one of the token
  return issuer.replace('{tenantid}', claims.tid)
}

const inflight = new Map<string, Promise<JwksEntry>>()

/** test hook: make the cached keys look older */
export const ageJwksCache = (ms: number): void => {
  for (const entry of jwksCache.values()) entry.fetchedAt -= ms
}

const fetchJwks = async (ctx: ProviderJwtContext): Promise<JwksEntry> => {
  try {
    const axios = ctx.trusted ? privateAxiosInstance : axiosInstance
    const data = (await axios.get(ctx.jwksUri!)).data as JSONWebKeySet
    if (!data || !Array.isArray(data.keys)) throw new Error('not a JWKS document')
    return { jwks: createLocalJWKSet(data), fetchedAt: Date.now(), lastForcedRefetchAt: jwksCache.get(ctx.jwksUri!)?.lastForcedRefetchAt ?? 0 }
  } catch (err: any) {
    throw new OidcValidationError('signature', `could not fetch the keys of OIDC provider ${ctx.id}: ${err.message}`, { cause: err })
  }
}

// one fetch at a time per URI, concurrent callers share it
const refreshJwks = (ctx: ProviderJwtContext): Promise<JwksEntry> => {
  let p = inflight.get(ctx.jwksUri!)
  if (!p) {
    p = fetchJwks(ctx).then(entry => { jwksCache.set(ctx.jwksUri!, entry); return entry })
    const clear = () => { inflight.delete(ctx.jwksUri!) }
    p.then(clear, clear)
    inflight.set(ctx.jwksUri!, p)
  }
  return p
}

const getJwks = async (ctx: ProviderJwtContext): Promise<JwksEntry> => {
  const entry = jwksCache.get(ctx.jwksUri!)
  if (entry && Date.now() - entry.fetchedAt <= JWKS_TTL) return entry
  try {
    return await refreshJwks(ctx)
  } catch (err) {
    if (!entry) throw err
    // provider outage: keep serving the stale keys, and retry later rather than at each request
    entry.fetchedAt = Date.now() - JWKS_TTL + FORCED_REFETCH_MIN_DELAY
    return entry
  }
}

const verifySignature = async (ctx: ProviderJwtContext, token: string, alg: string): Promise<JWTPayload> => {
  const options = { clockTolerance: CLOCK_TOLERANCE, algorithms: [alg] }
  if (symmetricAlgs.includes(alg)) {
    if (!ctx.clientSecret) throw new OidcValidationError('signature', 'no client secret to verify a symmetric signature')
    return (await jwtVerify(token, new TextEncoder().encode(ctx.clientSecret), options)).payload
  }
  if (!ctx.jwksUri) throw new OidcValidationError('signature', 'no jwks_uri to verify an asymmetric signature')
  const entry = await getJwks(ctx)
  try {
    return (await jwtVerify(token, entry.jwks, options)).payload
  } catch (err) {
    if (!(err instanceof errors.JWKSNoMatchingKey)) throw err
    // the provider may have rotated its keys
    let fresh: JwksEntry
    if (inflight.has(ctx.jwksUri)) {
      fresh = await refreshJwks(ctx)
    } else {
      if (Date.now() - entry.lastForcedRefetchAt < FORCED_REFETCH_MIN_DELAY) throw err
      entry.lastForcedRefetchAt = Date.now() // before awaiting: failures and concurrent callers are rate limited too
      fresh = await refreshJwks(ctx)
    }
    return (await jwtVerify(token, fresh.jwks, options)).payload
  }
}

const mapJoseError = (err: unknown): OidcValidationError => {
  if (err instanceof OidcValidationError) return err
  if (err instanceof errors.JWTExpired) return new OidcValidationError('exp', err.message)
  if (err instanceof errors.JWTClaimValidationFailed) {
    if (err.claim === 'exp') return new OidcValidationError('exp', err.message)
    if (err.claim === 'iat' || err.claim === 'nbf') return new OidcValidationError('iat', err.message)
    return new OidcValidationError('malformed', err.message)
  }
  if (err instanceof errors.JWSSignatureVerificationFailed || err instanceof errors.JWKSNoMatchingKey || err instanceof errors.JWKSMultipleMatchingKeys) {
    return new OidcValidationError('signature', err.message)
  }
  if (err instanceof errors.JOSEAlgNotAllowed || err instanceof errors.JOSENotSupported) return new OidcValidationError('alg', err.message)
  if (err instanceof errors.JWSInvalid || err instanceof errors.JWTInvalid) return new OidcValidationError('malformed', err.message)
  // anything else (key import failure, invalid key...) is a failure to verify the signature
  return new OidcValidationError('signature', (err as Error)?.message, { cause: err })
}

export async function verifyProviderJwt (ctx: ProviderJwtContext, token: string, opts: { nonce?: string, requireExp: boolean }): Promise<Record<string, any>> {
  let alg: string | undefined
  try {
    alg = decodeProtectedHeader(token).alg
  } catch (err: any) {
    throw new OidcValidationError('malformed', err.message)
  }
  if (!alg || (!symmetricAlgs.includes(alg) && !asymmetricAlgs.includes(alg))) {
    throw new OidcValidationError('alg', `unsupported alg ${alg}`)
  }

  let claims: JWTPayload
  try {
    claims = await verifySignature(ctx, token, alg)
  } catch (err) {
    throw mapJoseError(err)
  }

  if (opts.requireExp && typeof claims.exp !== 'number') throw new OidcValidationError('exp', 'missing exp claim')
  if (typeof claims.iat === 'number' && claims.iat > Date.now() / 1000 + CLOCK_TOLERANCE) throw new OidcValidationError('iat', 'iat claim in the future')

  if (!ctx.issuer) throw new OidcValidationError('iss', 'no expected issuer')
  if (claims.iss !== expectedIssuer(ctx.issuer, claims)) throw new OidcValidationError('iss')

  const audiences = Array.isArray(claims.aud) ? claims.aud : (claims.aud ? [claims.aud] : [])
  if (!audiences.includes(ctx.clientId)) throw new OidcValidationError('aud')
  if (audiences.length > 1 && claims.azp !== ctx.clientId) throw new OidcValidationError('azp')

  if (opts.nonce !== undefined && claims.nonce !== opts.nonce) throw new OidcValidationError('nonce')

  return claims
}
