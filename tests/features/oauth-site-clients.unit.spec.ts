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

  test('cors: a public client from an origin of its redirect uris', async () => {
    const { redirectUriCORS } = await clients()
    const client = { clientAuthMethod: 'none', redirectUris: ['https://app.example.org/cb'] }
    assert.ok(redirectUriCORS('https://app.example.org', client))
    assert.ok(!redirectUriCORS('https://evil.example.org', client))
    assert.ok(!redirectUriCORS('null', client))
    assert.ok(!redirectUriCORS('https://app.example.org', { ...client, clientAuthMethod: 'private_key_jwt' }))
  })
})
