import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from '@playwright/test'
import '../support/unit.ts'

const dynamicClients = () => import('../../api/src/oauth-server/dynamic-clients.ts')

// a copy of https://claude.ai/oauth/claude-code-client-metadata
const claudeCode = () => JSON.parse(readFileSync(new URL('../fixtures/claude-code-client-metadata.json', import.meta.url), 'utf8'))

const throwsOAuth = (fn: () => unknown, error: string) =>
  assert.throws(fn, (err: any) => err.error === error && err.status === 400)

test.describe('oauth dynamic clients', () => {
  test('dynamicRedirectUriAllowed', async () => {
    const { dynamicRedirectUriAllowed } = await dynamicClients()
    const table: [string, boolean][] = [
      ['https://claude.ai/api/mcp/auth_callback', true],
      ['http://localhost:33418/callback', true],
      ['http://127.0.0.1/cb', true],
      ['http://[::1]:8080/cb', true],
      ['com.example.app:/cb', true],
      ['http://example.org/cb', false],
      ['javascript:alert(1)', false],
      ['data:text/html,x', false],
      ['file:///etc/passwd', false],
      ['vbscript:x', false],
      ['blob:https://x.org/1', false],
      ['about:blank', false],
      ['myapp:/cb', false],
      ['https://x.org/cb#f', false],
      ['https://x.org/cb#', false],
      ['https://user:pw@x.org/cb', false],
      ['https://localhost/cb', false],
      ['not a url', false]
    ]
    for (const [uri, expected] of table) assert.equal(dynamicRedirectUriAllowed(uri), expected, uri)
  })

  test('normalizeDynamicMetadata applies the loopback fix to the claude code document', async () => {
    const { normalizeDynamicMetadata } = await dynamicClients()
    const normalized = normalizeDynamicMetadata(claudeCode())
    assert.equal(normalized.application_type, 'native')
    assert.equal(normalized.token_endpoint_auth_method, 'none')
    assert.deepEqual(normalized.grant_types, ['authorization_code', 'refresh_token'])
    assert.deepEqual(normalized.response_types, ['code'])
  })

  test('normalizeDynamicMetadata defaults and refusals', async () => {
    const { normalizeDynamicMetadata } = await dynamicClients()
    const base = { redirect_uris: ['https://agent.example.org/cb'] }
    const normalized = normalizeDynamicMetadata(base)
    assert.equal(normalized.token_endpoint_auth_method, 'none')
    assert.deepEqual(normalized.grant_types, ['authorization_code', 'refresh_token'])
    assert.deepEqual(normalized.response_types, ['code'])
    assert.equal(normalized.application_type, undefined)

    throwsOAuth(() => normalizeDynamicMetadata({ ...claudeCode(), grant_types: ['client_credentials'] }), 'invalid_client_metadata')
    throwsOAuth(() => normalizeDynamicMetadata({ ...base, grant_types: ['authorization_code', 'implicit'] }), 'invalid_client_metadata')
    throwsOAuth(() => normalizeDynamicMetadata({ ...base, token_endpoint_auth_method: 'client_secret_basic' }), 'invalid_client_metadata')
    throwsOAuth(() => normalizeDynamicMetadata({ ...base, response_types: ['code id_token'] }), 'invalid_client_metadata')
    throwsOAuth(() => normalizeDynamicMetadata({ ...claudeCode(), redirect_uris: ['http://example.org/cb'] }), 'invalid_redirect_uri')
    throwsOAuth(() => normalizeDynamicMetadata({ redirect_uris: [] }), 'invalid_redirect_uri')
    throwsOAuth(() => normalizeDynamicMetadata({}), 'invalid_redirect_uri')
    throwsOAuth(() => normalizeDynamicMetadata({ ...base, logo_uri: 'http://agent.example.org/logo.png' }), 'invalid_client_metadata')
    // a mix with loopback uris would get the port relaxation for its other uris too
    throwsOAuth(() => normalizeDynamicMetadata({ redirect_uris: ['http://localhost/cb', 'com.example.app:/cb'] }), 'invalid_redirect_uri')
  })

  test('normalizeDynamicMetadata keeps the port relaxation to all-loopback clients', async () => {
    const { normalizeDynamicMetadata } = await dynamicClients()
    assert.equal(normalizeDynamicMetadata({ redirect_uris: ['http://localhost/cb'], application_type: 'web' }).application_type, 'native')
    // a loopback uri next to an https one is matched exactly
    assert.equal(normalizeDynamicMetadata({ redirect_uris: ['http://localhost/cb', 'https://x.org/cb'], application_type: 'native' }).application_type, 'web')
    // private-use schemes are only accepted by the provider for native clients
    assert.equal(normalizeDynamicMetadata({ redirect_uris: ['com.example.app:/cb'] }).application_type, 'native')
  })

  test('normalizeDynamicMetadata strips sd_ metadata and outbound fetch triggers', async () => {
    const { normalizeDynamicMetadata } = await dynamicClients()
    const normalized = normalizeDynamicMetadata({
      ...claudeCode(),
      sd_allowed_origins: ['https://evil.example.org'],
      sd_other: 1,
      sector_identifier_uri: 'https://x.org/sector'
    })
    assert.equal(normalized.sd_allowed_origins, undefined)
    assert.equal(normalized.sd_other, undefined)
    assert.equal(normalized.sector_identifier_uri, undefined)
    assert.equal(normalized.client_name, 'Claude Code')
  })

  test('ssrfFetch refuses non public addresses', async () => {
    const { ssrfFetch } = await dynamicClients()
    for (const url of ['https://127.0.0.1:8443/doc', 'https://[::1]:8443/doc', 'https://localhost:8443/doc', 'https://10.1.2.3/doc']) {
      await assert.rejects(ssrfFetch(url, { method: 'GET', signal: AbortSignal.timeout(2500) }), (err: any) => /not a public address|fetch failed/.test(err.message), url)
    }
    await assert.rejects(ssrfFetch('http://example.org/doc', { method: 'GET' }), /https/)
  })
})
