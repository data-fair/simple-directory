import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import '../support/unit.ts'

const clients = () => import('../../api/src/oauth-server/clients.ts')

const client = (extra: Record<string, any> = {}) => ({
  id: 'site-abc',
  name: 'Dash',
  redirectUris: ['https://dash.example.org/cb?x=1'] as [string],
  scopes: ['organizations:read'] as [string],
  ...extra
})

test.describe('oauth site clients', () => {
  test('clientKind derives the kind from the id shape', async () => {
    const { clientKind } = await clients()
    assert.equal(clientKind('nhi-abc'), 'nhi')
    assert.equal(clientKind('site-abc'), 'site')
    assert.equal(clientKind('https://claude.ai/oauth/x'), 'cimd')
    assert.equal(clientKind('Xy12abc'), 'dcr')
    assert.equal(clientKind('dcr-Xy12abc'), 'dcr')
  })

  test('siteRedirectUriAllowed', async () => {
    const { siteRedirectUriAllowed } = await clients()
    assert.ok(siteRedirectUriAllowed('https://dash.example.org/cb'))
    assert.ok(siteRedirectUriAllowed('http://localhost:5173/cb'))
    assert.ok(!siteRedirectUriAllowed('http://dash.example.org/cb'))
    assert.ok(!siteRedirectUriAllowed('javascript:alert(1)'))
    assert.ok(!siteRedirectUriAllowed('https://u:p@dash.example.org/cb'))
    assert.ok(!siteRedirectUriAllowed('https://dash.example.org/cb#x'))
    assert.ok(!siteRedirectUriAllowed('https://dash.example.org/cb#'))
  })

  test('isLoopbackRedirectUri', async () => {
    const { isLoopbackRedirectUri } = await clients()
    assert.ok(isLoopbackRedirectUri('http://127.0.0.1:3000/cb'))
    assert.ok(isLoopbackRedirectUri('http://[::1]:3000/cb'))
    assert.ok(!isLoopbackRedirectUri('https://localhost/cb'))
    assert.ok(!isLoopbackRedirectUri('http://localhost.evil.org/cb'))
  })

  test('siteClientMetadata is a public code flow client', async () => {
    const { siteClientMetadata } = await clients()
    const metadata = siteClientMetadata(client())
    assert.equal(metadata.token_endpoint_auth_method, 'none')
    assert.deepEqual(metadata.grant_types, ['authorization_code', 'refresh_token'])
    assert.deepEqual(metadata.response_types, ['code'])
    assert.equal(metadata.client_id, 'site-abc')
  })

  test('siteClientOrigins defaults to the origins of the redirect uris', async () => {
    const { siteClientOrigins } = await clients()
    assert.deepEqual(siteClientOrigins(client()), ['https://dash.example.org'])
    assert.deepEqual(siteClientOrigins(client({ allowedOrigins: ['https://other.example.org'] })), ['https://other.example.org'])
  })

  test('only a site client may name its CORS origins', async () => {
    const { sdClientBasedCORS } = await clients()
    const origin = 'https://evil.example.org'
    assert.ok(sdClientBasedCORS(origin, { clientId: 'site-abc', sd_allowed_origins: [origin] }))
    assert.ok(!sdClientBasedCORS('https://other.example.org', { clientId: 'site-abc', sd_allowed_origins: [origin] }))
    assert.ok(!sdClientBasedCORS(origin, { clientId: 'nhi-abc', clientAuthMethod: 'private_key_jwt', sd_allowed_origins: [origin] }))
    assert.ok(!sdClientBasedCORS(origin, { clientId: 'Xy12abc', clientAuthMethod: 'none', redirectUris: ['https://app.example.org/cb'], sd_allowed_origins: [origin] }))
    assert.ok(sdClientBasedCORS('https://app.example.org', { clientId: 'Xy12abc', clientAuthMethod: 'none', redirectUris: ['https://app.example.org/cb'] }))
  })
})
