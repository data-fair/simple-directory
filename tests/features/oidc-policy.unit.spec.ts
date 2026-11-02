import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'

process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || './api/config/'
process.env.NODE_ENV = process.env.NODE_ENV || 'test'
process.env.SUPPRESS_NO_CONFIG_WARNING = '1'

const { applyOidcPolicy } = await import('../../api/src/oauth/oidc.ts')
const { OidcValidationError, issuerParameterMatches } = await import('../../api/src/oauth/oidc-jwt.ts')
const { default: log } = await import('@data-fair/lib-node/log.js')

test.describe('OIDC validation policy', () => {
  test('a strict provider rethrows the failure', () => {
    const err = new OidcValidationError('aud')
    assert.throws(() => applyOidcPolicy({ id: 'p', strict: true }, err, {}), (e) => e === err)
  })

  test('a non strict provider raises an alert with its check and goes on', () => {
    const calls: any[] = []
    const original = log.alert
    log.alert = ((...args: any[]) => { calls.push(args) }) as any
    try {
      applyOidcPolicy({ id: 'p', strict: false }, new OidcValidationError('signature', 'jwks unreachable'), { })
      applyOidcPolicy({ id: 'p', strict: false }, new OidcValidationError('exp'))
    } finally {
      log.alert = original
    }
    // no alert without logFields (background paths)
    assert.equal(calls.length, 1)
    assert.match(calls[0][0], /jwks unreachable/)
    assert.equal(calls[0][1].code, 'sd.oidc.validation-failed')
    assert.equal(calls[0][1].providerId, 'p')
    assert.equal(calls[0][1].check, 'signature')
  })

  test('the iss parameter of a templated issuer accepts any single segment tenant', () => {
    const issuer = 'https://login.microsoftonline.com/{tenantid}/v2.0'
    assert.ok(issuerParameterMatches(issuer, 'https://login.microsoftonline.com/abc-123/v2.0'))
    assert.ok(!issuerParameterMatches(issuer, 'https://login.microsoftonline.com/a/b/v2.0'))
    assert.ok(!issuerParameterMatches(issuer, 'https://login.microsoftonline.com//v2.0'))
    assert.ok(!issuerParameterMatches(issuer, 'https://evil.example.com/abc/v2.0'))
    assert.ok(issuerParameterMatches('http://localhost:1', 'http://localhost:1'))
    assert.ok(!issuerParameterMatches('http://localhost:1', 'http://localhost:2'))
  })
})
