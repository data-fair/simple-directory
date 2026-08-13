import { test } from '@playwright/test'
import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import jwt from 'jsonwebtoken'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

const { verifyAssertion } = await import('../../api/src/nhis/service.ts')
const { assertSafeIssuer } = await import('../../api/src/nhis/keys.ts')
const config = (await import('../../api/src/config.ts')).default

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const publicJwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }
const jwks = { keys: [publicJwk] }
const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string

const issuer = 'https://test-issuer.example.com'
const subject = 'system:serviceaccount:agents:my-agent'
const audience = 'https://sd.example.com'
const provider = { issuer, jwks }

const sign = (claims: Record<string, any> = {}, opts: jwt.SignOptions = {}) =>
  jwt.sign({ iss: issuer, sub: subject, aud: audience, ...claims }, privatePem,
    { algorithm: 'RS256', keyid: 'test-key', expiresIn: '10m', ...opts })

test('valid assertion is accepted', async () => {
  const payload = await verifyAssertion(sign(), provider, subject, audience)
  assert.equal(payload.sub, subject)
  assert.ok(payload.exp)
})

test('wrong subject is rejected', async () => {
  await assert.rejects(verifyAssertion(sign({ sub: 'system:serviceaccount:agents:other' }), provider, subject, audience))
})

test('wrong audience is rejected', async () => {
  await assert.rejects(verifyAssertion(sign({ aud: 'https://other.example.com' }), provider, subject, audience))
})

test('wrong issuer is rejected', async () => {
  await assert.rejects(verifyAssertion(sign({ iss: 'https://evil.example.com' }), provider, subject, audience))
})

test('expired assertion is rejected', async () => {
  await assert.rejects(verifyAssertion(sign({}, { expiresIn: '-1m' }), provider, subject, audience))
})

test('assertion signed by an unknown key is rejected', async () => {
  const { privateKey: otherKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const forged = jwt.sign({ iss: issuer, sub: subject, aud: audience }, otherKey.export({ type: 'pkcs8', format: 'pem' }) as string,
    { algorithm: 'RS256', keyid: 'test-key', expiresIn: '10m' })
  await assert.rejects(verifyAssertion(forged, provider, subject, audience))
})

// test.cfg sets nhisAllowInsecureIssuers: true so other suites can use plain http
// issuers in this same worker process; force it false around these cases and restore
// it afterwards since the config object is a mutable singleton shared across files.
test.describe('assertSafeIssuer (SSRF guard)', () => {
  test.beforeEach(() => { config.nhisAllowInsecureIssuers = false })
  test.afterEach(() => { config.nhisAllowInsecureIssuers = true })

  test('non-https issuer is rejected', () => {
    assert.throws(() => assertSafeIssuer('http://example.com'))
  })

  test('loopback ipv4 issuer is rejected', () => {
    assert.throws(() => assertSafeIssuer('https://127.0.0.1'))
  })

  test('alternate ipv4 encoding is rejected (proves URL canonicalization is used)', () => {
    assert.throws(() => assertSafeIssuer('https://0x7f.0.0.1'))
  })

  test('ipv4-mapped ipv6 loopback is rejected', () => {
    assert.throws(() => assertSafeIssuer('https://[::ffff:127.0.0.1]'))
  })

  test('unique-local ipv6 issuer is rejected', () => {
    assert.throws(() => assertSafeIssuer('https://[fd00::1]'))
  })

  test('localhost issuer is rejected', () => {
    assert.throws(() => assertSafeIssuer('https://localhost'))
  })

  test('public hostname issuer is accepted', () => {
    assert.doesNotThrow(() => assertSafeIssuer('https://kubernetes.example.com'))
  })

  test('malformed issuer url is rejected without a raw TypeError', () => {
    assert.throws(() => assertSafeIssuer('not a url'), (err: any) => err.status === 400)
  })

  test('private host is accepted when nhisAllowInsecureIssuers is true', () => {
    config.nhisAllowInsecureIssuers = true
    assert.doesNotThrow(() => assertSafeIssuer('http://127.0.0.1'))
  })
})
