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

test.describe('oauth server provider cache', () => {
  test('a site update does not change the provider cache marker', async () => {
    const { cacheMarker } = await import('../../api/src/oauth-server/providers.ts')
    const site: any = { _id: 'test_site', host: 'x.org', owner: { type: 'organization', id: 'o1' }, updatedAt: '2026-01-01T00:00:00Z' }
    const ctx = { issuer: 'https://x.org/simple-directory', siteUrl: 'https://x.org', site }
    const updated = { ...ctx, site: { ...site, updatedAt: '2026-02-01T00:00:00Z', oauthClients: [] } }
    assert.equal(cacheMarker(ctx, 'kid1'), cacheMarker(updated, 'kid1'))
    assert.notEqual(cacheMarker(ctx, 'kid1'), cacheMarker(ctx, 'kid2'))
  })
})
