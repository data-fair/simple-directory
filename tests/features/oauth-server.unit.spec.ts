import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import '../support/unit.ts'

test.describe('oauth server mount path', () => {
  test('originalUrl is the issuer path followed by the route', async () => {
    const { providerOriginalUrl } = await import('../../api/src/oauth-server/router.ts')
    // an issuer at the root of its origin must not produce a protocol-relative "//api/..." path
    assert.equal(providerOriginalUrl('http://localhost:8080', '/api/oauth/token'), '/api/oauth/token')
    assert.equal(providerOriginalUrl('http://localhost:8080/', '/api/oauth/token'), '/api/oauth/token')
    assert.equal(providerOriginalUrl('http://localhost:8080/simple-directory', '/api/oauth/token'), '/simple-directory/api/oauth/token')
    assert.equal(providerOriginalUrl('https://portal.example.org/portal/simple-directory', '/.well-known/openid-configuration'),
      '/portal/simple-directory/.well-known/openid-configuration')
  })
})
