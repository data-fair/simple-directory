import { strict as assert } from 'node:assert'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { test } from '@playwright/test'
import { generateKeyPair, exportJWK, SignJWT } from 'jose'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

const { verifyProviderJwt, clearJwksCache, ageJwksCache, expectedIssuer, OidcValidationError } = await import('../../api/src/oauth/oidc-jwt.ts')

const ISSUER = 'https://idp.test.com'
const CLIENT_ID = 'test_client'
const CLIENT_SECRET = 'a-very-long-client-secret-for-hs256-signatures'

const newKey = async (kid: string) => {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true })
  const jwk = await exportJWK(publicKey)
  return { privateKey, jwk: { ...jwk, kid, alg: 'RS256', use: 'sig' } }
}

let server: http.Server
let jwksUri: string
let served: any[] = []
let requests = 0
let failing = false

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    requests++
    if (failing) { res.statusCode = 500; res.end('boom'); return }
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ keys: served }))
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  jwksUri = `http://127.0.0.1:${(server.address() as AddressInfo).port}/jwks`
})
test.afterAll(() => { server.close() })
test.beforeEach(() => {
  clearJwksCache()
  requests = 0
  failing = false
})

const ctx = (extra: Record<string, any> = {}) => ({ id: 'test_p', issuer: ISSUER, jwksUri, clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, trusted: true, ...extra })
const now = () => Math.floor(Date.now() / 1000)

const sign = (key: any, claims: Record<string, any> = {}, kid = 'k1') => {
  const payload = { sub: 'u1', iss: ISSUER, aud: CLIENT_ID, iat: now(), exp: now() + 600, ...claims }
  return new SignJWT(payload).setProtectedHeader({ alg: 'RS256', kid }).sign(key)
}

const expectCheck = async (p: Promise<any>, check: string) => {
  try {
    await p
  } catch (err: any) {
    assert.ok(err instanceof OidcValidationError, 'expected OidcValidationError, got ' + err)
    assert.equal(err.check, check)
    return
  }
  assert.fail('expected rejection with check ' + check)
}

test.describe('verifyProviderJwt', () => {
  test('valid token returns claims', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    const claims = await verifyProviderJwt(ctx(), await sign(k.privateKey), { requireExp: true })
    assert.equal(claims.sub, 'u1')
  })

  test('wrong key -> signature', async () => {
    const k = await newKey('k1')
    const other = await newKey('k1')
    served = [k.jwk]
    await expectCheck(verifyProviderJwt(ctx(), await sign(other.privateKey), { requireExp: true }), 'signature')
  })

  test('iss mismatch -> iss', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    await expectCheck(verifyProviderJwt(ctx(), await sign(k.privateKey, { iss: 'https://evil.com' }), { requireExp: true }), 'iss')
  })

  test('aud of another client -> aud', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    await expectCheck(verifyProviderJwt(ctx(), await sign(k.privateKey, { aud: 'other' }), { requireExp: true }), 'aud')
  })

  test('multiple aud without azp -> azp', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    const t = await sign(k.privateKey, { aud: [CLIENT_ID, 'other'] })
    await expectCheck(verifyProviderJwt(ctx(), t, { requireExp: true }), 'azp')
    const ok = await sign(k.privateKey, { aud: [CLIENT_ID, 'other'], azp: CLIENT_ID })
    assert.equal((await verifyProviderJwt(ctx(), ok, { requireExp: true })).sub, 'u1')
  })

  test('expired 2 minutes ago -> exp, 30s ago passes', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    await expectCheck(verifyProviderJwt(ctx(), await sign(k.privateKey, { exp: now() - 120 }), { requireExp: true }), 'exp')
    const claims = await verifyProviderJwt(ctx(), await sign(k.privateKey, { exp: now() - 30 }), { requireExp: true })
    assert.equal(claims.sub, 'u1')
  })

  test('missing exp depends on requireExp', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    const t = await new SignJWT({ sub: 'u1', iss: ISSUER, aud: CLIENT_ID }).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).sign(k.privateKey)
    await expectCheck(verifyProviderJwt(ctx(), t, { requireExp: true }), 'exp')
    assert.equal((await verifyProviderJwt(ctx(), t, { requireExp: false })).sub, 'u1')
  })

  test('nonce mismatch -> nonce', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    const t = await sign(k.privateKey, { nonce: 'n1' })
    assert.equal((await verifyProviderJwt(ctx(), t, { requireExp: true, nonce: 'n1' })).nonce, 'n1')
    await expectCheck(verifyProviderJwt(ctx(), t, { requireExp: true, nonce: 'n2' }), 'nonce')
  })

  test('alg none -> alg', async () => {
    const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString('base64url')
    const t = `${b64({ alg: 'none' })}.${b64({ sub: 'u1', iss: ISSUER, aud: CLIENT_ID, exp: now() + 600 })}.`
    await expectCheck(verifyProviderJwt(ctx(), t, { requireExp: true }), 'alg')
  })

  test('garbage -> malformed', async () => {
    await expectCheck(verifyProviderJwt(ctx(), 'not-a-jwt', { requireExp: true }), 'malformed')
  })

  test('HS256 signed with the client secret passes, other secret fails', async () => {
    const mk = (secret: string) => new SignJWT({ sub: 'u1', iss: ISSUER, aud: CLIENT_ID, exp: now() + 600 })
      .setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode(secret))
    assert.equal((await verifyProviderJwt(ctx(), await mk(CLIENT_SECRET), { requireExp: true })).sub, 'u1')
    await expectCheck(verifyProviderJwt(ctx(), await mk('another-secret-another-secret-another'), { requireExp: true }), 'signature')
  })

  test('Entra issuer template', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    const tmpl = 'https://login.microsoftonline.com/{tenantid}/v2.0'
    const c = ctx({ issuer: tmpl })
    const good = await sign(k.privateKey, { iss: 'https://login.microsoftonline.com/abc/v2.0', tid: 'abc' })
    assert.equal((await verifyProviderJwt(c, good, { requireExp: true })).tid, 'abc')
    const bad = await sign(k.privateKey, { iss: 'https://login.microsoftonline.com/abc/v2.0', tid: 'def' })
    await expectCheck(verifyProviderJwt(c, bad, { requireExp: true }), 'iss')
    assert.equal(expectedIssuer(tmpl, { tid: 'x' }), 'https://login.microsoftonline.com/x/v2.0')
  })

  test('new kid triggers exactly one refetch', async () => {
    const k1 = await newKey('k1')
    const k2 = await newKey('k2')
    served = [k1.jwk]
    await verifyProviderJwt(ctx(), await sign(k1.privateKey), { requireExp: true })
    assert.equal(requests, 1)
    served = [k2.jwk]
    const claims = await verifyProviderJwt(ctx(), await sign(k2.privateKey, {}, 'k2'), { requireExp: true })
    assert.equal(claims.sub, 'u1')
    assert.equal(requests, 2)
  })

  test('unknown kid is not refetched more than once per minute', async () => {
    const k1 = await newKey('k1')
    const k3 = await newKey('k3')
    served = [k1.jwk]
    const t = await sign(k3.privateKey, {}, 'k3')
    await expectCheck(verifyProviderJwt(ctx(), t, { requireExp: true }), 'signature')
    assert.equal(requests, 2)
    await expectCheck(verifyProviderJwt(ctx(), t, { requireExp: true }), 'signature')
    assert.equal(requests, 2)
  })

  test('no expected issuer fails closed', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    await expectCheck(verifyProviderJwt(ctx({ issuer: undefined }), await sign(k.privateKey), { requireExp: true }), 'iss')
  })

  test('JWKS endpoint failing -> signature', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    failing = true
    await expectCheck(verifyProviderJwt(ctx(), await sign(k.privateKey), { requireExp: true }), 'signature')
  })

  test('concurrent unknown kids trigger a single refetch', async () => {
    const k1 = await newKey('k1')
    const k3 = await newKey('k3')
    served = [k1.jwk]
    await verifyProviderJwt(ctx(), await sign(k1.privateKey), { requireExp: true })
    assert.equal(requests, 1)
    const t = await sign(k3.privateKey, {}, 'k3')
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => verifyProviderJwt(ctx(), t, { requireExp: true })))
    assert.ok(results.every(r => r.status === 'rejected'))
    assert.equal(requests, 2)
  })

  test('failing forced refetch is rate limited', async () => {
    const k1 = await newKey('k1')
    const k3 = await newKey('k3')
    served = [k1.jwk]
    await verifyProviderJwt(ctx(), await sign(k1.privateKey), { requireExp: true })
    failing = true
    const t = await sign(k3.privateKey, {}, 'k3')
    await expectCheck(verifyProviderJwt(ctx(), t, { requireExp: true }), 'signature')
    await expectCheck(verifyProviderJwt(ctx(), t, { requireExp: true }), 'signature')
    assert.equal(requests, 2)
  })

  test('stale keys are served when the refresh fails', async () => {
    const k = await newKey('k1')
    served = [k.jwk]
    const t = await sign(k.privateKey)
    await verifyProviderJwt(ctx(), t, { requireExp: true })
    ageJwksCache(2 * 3600 * 1000)
    failing = true
    assert.equal((await verifyProviderJwt(ctx(), t, { requireExp: true })).sub, 'u1')
    assert.equal(requests, 2)
    assert.equal((await verifyProviderJwt(ctx(), t, { requireExp: true })).sub, 'u1')
    assert.equal(requests, 2)
  })
})
