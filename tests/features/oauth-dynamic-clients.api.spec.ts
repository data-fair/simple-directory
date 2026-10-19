// Dynamic clients of the authorization server: client id metadata documents (CIMD) and dynamic
// client registration (DCR).
// tests/fixtures/claude-code-client-metadata.json is a copy of
// https://claude.ai/oauth/claude-code-client-metadata fetched on 2026-10-19.
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { test } from '@playwright/test'
import { RateLimiterMongo } from 'rate-limiter-flexible'
import { axios, testEnvAx, getServerConfig, directoryUrl } from '../support/axios.ts'
import { startAuthorization, interactionUid, type CodeFlowOptions } from '../support/oauth-client.ts'
import { withMongo } from '../support/oauth-code-site.ts'

const issuer = directoryUrl
const claudeCode = () => JSON.parse(readFileSync(new URL('../fixtures/claude-code-client-metadata.json', import.meta.url), 'utf8'))

let ipCounter = 0
const nextIp = () => { ipCounter++; return `10.88.${ipCounter >> 8}.${ipCounter & 255}` }

const register = (body: unknown, ip = nextIp(), headers: Record<string, string> = {}) =>
  axios().post(issuer + '/api/oauth/register', body, { validateStatus: () => true, headers: { 'x-forwarded-for': ip, ...headers } })

const flow = (clientId: string, redirectUri: string): CodeFlowOptions => ({
  issuer, clientId, redirectUri, scope: 'organizations:read', browserAx: axios()
})

// the authorization request reached SD's interaction entry: the client and its redirect uri were accepted
const assertReachesInteraction = async (opts: CodeFlowOptions) => {
  const { location } = await startAuthorization(opts)
  interactionUid(location)
}

// an error that cannot be redirected to the client goes to the consent page of the SPA
const authorizeRenderedError = async (opts: CodeFlowOptions) => {
  const { location } = await startAuthorization(opts)
  const url = new URL(location)
  assert.ok(url.pathname.endsWith('/oauth/consent'), 'not an error page: ' + location)
  return url.searchParams.get('error')
}

const withOAuthServer = async (patch: Record<string, any>, fn: () => Promise<void>) => {
  const oauthServer = (await testEnvAx.get('/config')).data.oauthServer
  await testEnvAx.patch('/config', { oauthServer: { ...oauthServer, ...patch } })
  try {
    await fn()
  } finally {
    await testEnvAx.patch('/config', { oauthServer })
  }
}

test.describe('oauth dynamic clients', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { mainSiteFromDb: [] })
  })

  test('dcr registers a public native client', async () => {
    const res = await register(claudeCode())
    assert.equal(res.status, 201, JSON.stringify(res.data))
    assert.ok(res.data.client_id)
    assert.match(res.data.client_id, /^dcr-[A-Za-z0-9_-]{20,}$/)
    assert.equal(res.data.registration_access_token, undefined)
    assert.equal(res.data.registration_client_uri, undefined)
    assert.equal(res.data.client_secret, undefined)
    assert.equal(res.data.application_type, 'native')
    assert.equal(res.data.token_endpoint_auth_method, 'none')
    assert.deepEqual(res.data.grant_types, ['authorization_code', 'refresh_token'])

    const stored = await withMongo(db => db.collection<any>('oauth-client').findOne({ _id: res.data.client_id }))
    assert.ok(stored)
    assert.ok(stored.createdAt instanceof Date)
    assert.equal(stored.issuer, issuer)

    // the registered client is usable, with the loopback port relaxation
    await assertReachesInteraction(flow(res.data.client_id, 'http://localhost:40123/callback'))
  })

  test('dcr refuses client_credentials, client_secret methods and non-loopback http redirects', async () => {
    const cases: [Record<string, any>, string][] = [
      [{ ...claudeCode(), grant_types: ['client_credentials'] }, 'invalid_client_metadata'],
      [{ ...claudeCode(), grant_types: ['authorization_code', 'urn:ietf:params:oauth:grant-type:jwt-bearer'] }, 'invalid_client_metadata'],
      [{ ...claudeCode(), token_endpoint_auth_method: 'client_secret_basic' }, 'invalid_client_metadata'],
      [{ ...claudeCode(), token_endpoint_auth_method: 'client_secret_post' }, 'invalid_client_metadata'],
      [{ ...claudeCode(), redirect_uris: ['http://example.org/cb'] }, 'invalid_redirect_uri'],
      [{ ...claudeCode(), redirect_uris: ['javascript:alert(1)'] }, 'invalid_redirect_uri'],
      [{ ...claudeCode(), redirect_uris: ['https://x.org/cb#frag'] }, 'invalid_redirect_uri'],
      [{ ...claudeCode(), logo_uri: 'http://x.org/logo.png' }, 'invalid_client_metadata'],
      [{ ...claudeCode(), client_uri: 'http://x.org' }, 'invalid_client_metadata'],
      [{ ...claudeCode(), policy_uri: 'http://x.org/policy' }, 'invalid_client_metadata'],
      [{ ...claudeCode(), tos_uri: 'http://x.org/tos' }, 'invalid_client_metadata'],
      [{ ...claudeCode(), token_endpoint_auth_method: 'private_key_jwt', jwks_uri: 'http://x.org/jwks' }, 'invalid_client_metadata'],
      [{ ...claudeCode(), sd_allowed_origins: ['https://evil.example.org'] }, '']
    ]
    for (const [body, error] of cases) {
      const res = await register(body)
      if (!error) {
        // sd_ metadata is stripped, never stored
        assert.equal(res.status, 201, JSON.stringify(res.data))
        assert.equal(res.data.sd_allowed_origins, undefined)
        const stored = await withMongo(db => db.collection<any>('oauth-client').findOne({ _id: res.data.client_id }))
        assert.equal(stored.payload.sd_allowed_origins, undefined)
        continue
      }
      assert.equal(res.status, 400, JSON.stringify(body) + ' ' + JSON.stringify(res.data))
      assert.equal(res.data.error, error, JSON.stringify(body))
    }
    // not JSON
    const notJson = await register('client_name=x', nextIp(), { 'content-type': 'application/x-www-form-urlencoded' })
    assert.equal(notJson.status, 400)
    assert.equal(notJson.data.error, 'invalid_request')
    const array = await register([claudeCode()])
    assert.equal(array.status, 400)
    assert.equal(array.data.error, 'invalid_request')
    // only the stripped sd_ case registered a client
    assert.equal(await withMongo(db => db.collection('oauth-client').countDocuments()), 1)
  })

  test('dcr is rate limited per ip', async () => {
    const config = await getServerConfig()
    const ip = '10.89.0.1'
    await withMongo(async (db) => {
      const rateLimiter = new RateLimiterMongo({
        storeClient: (db as any).client,
        dbName: db.databaseName,
        keyPrefix: 'sd-rate-limiter-auth',
        points: config.authRateLimit.attempts,
        duration: config.authRateLimit.duration
      })
      // 5 registrations left in this window
      await rateLimiter.set('oauth-dcr:' + ip, config.authRateLimit.attempts - 5, config.authRateLimit.duration)
    })
    for (let i = 0; i < 5; i++) {
      const res = await register(claudeCode(), ip)
      assert.equal(res.status, 201, `registration ${i}: ${JSON.stringify(res.data)}`)
    }
    const limited = await register(claudeCode(), ip)
    assert.equal(limited.status, 429, JSON.stringify(limited.data))
    // another address is not affected
    assert.equal((await register(claudeCode())).status, 201)
  })

  test('dcr and cimd are 404 / not advertised without dynamicClients', async () => {
    const on = (await axios().get(issuer + '/.well-known/openid-configuration')).data
    assert.equal(on.registration_endpoint, issuer + '/api/oauth/register')
    assert.equal(on.client_id_metadata_document_supported, true)

    await testEnvAx.post('/cimd-fixtures', { url: 'https://cimd.test/claude-code', document: { ...claudeCode(), client_id: 'https://cimd.test/claude-code' } })
    await withOAuthServer({ dynamicClients: false }, async () => {
      const discovery = (await axios().get(issuer + '/.well-known/openid-configuration')).data
      assert.equal(discovery.registration_endpoint, undefined)
      assert.equal(discovery.client_id_metadata_document_supported, undefined)
      assert.equal((await register(claudeCode())).status, 404)
      assert.equal(await authorizeRenderedError(flow('https://cimd.test/claude-code', 'http://localhost/callback')), 'invalid_client')
    })
    // dynamicClients needs the authorization code flow
    await withOAuthServer({ authorizationCode: false }, async () => {
      const discovery = (await axios().get(issuer + '/.well-known/openid-configuration')).data
      assert.equal(discovery.registration_endpoint, undefined)
      assert.equal(discovery.client_id_metadata_document_supported, undefined)
      assert.equal((await register(claudeCode())).status, 404)
    })
  })

  test('a cimd client from a fixture reaches the consent entry', async () => {
    const clientId = 'https://cimd.test/claude-code'
    await testEnvAx.post('/cimd-fixtures', { url: clientId, document: { ...claudeCode(), client_id: clientId } })
    // a port absent from the document: the loopback rule applies
    await assertReachesInteraction(flow(clientId, 'http://localhost:40123/callback'))
    await assertReachesInteraction(flow(clientId, 'http://127.0.0.1:40124/callback'))
    // but the path is exact
    assert.equal(await authorizeRenderedError(flow(clientId, 'http://localhost:40123/other')), 'invalid_redirect_uri')

    // a document breaking the redirect rule is refused
    const badId = 'https://cimd.test/bad'
    await testEnvAx.post('/cimd-fixtures', { url: badId, document: { ...claudeCode(), client_id: badId, redirect_uris: ['http://example.org/callback'] } })
    assert.equal(await authorizeRenderedError(flow(badId, 'http://example.org/callback')), 'invalid_client')
    // and so is one asking for client_credentials
    const machineId = 'https://cimd.test/machine'
    await testEnvAx.post('/cimd-fixtures', { url: machineId, document: { ...claudeCode(), client_id: machineId, grant_types: ['client_credentials'] } })
    assert.equal(await authorizeRenderedError(flow(machineId, 'http://localhost/callback')), 'invalid_client')
  })

  test('cimd fetches are rate limited per ip on cache misses', async () => {
    const config = await getServerConfig()
    const ip = '10.90.0.1'
    await withMongo(async (db) => {
      const rateLimiter = new RateLimiterMongo({
        storeClient: (db as any).client,
        dbName: db.databaseName,
        keyPrefix: 'sd-rate-limiter-auth',
        points: config.authRateLimit.attempts,
        duration: config.authRateLimit.duration
      })
      // one fetch left in this window
      await rateLimiter.set('oauth-cimd:' + ip, config.authRateLimit.attempts - 1, config.authRateLimit.duration)
    })
    // unique per run: the provider caches fetched documents for at least 30 s
    const run = Date.now().toString(36)
    const ids = [1, 2, 3].map(i => `https://cimd.test/limited-${run}-${i}`)
    for (const id of ids) await testEnvAx.post('/cimd-fixtures', { url: id, document: { ...claudeCode(), client_id: id } })
    const from = (clientId: string, addr: string): CodeFlowOptions => ({
      ...flow(clientId, 'http://localhost:40123/callback'), browserAx: axios({ headers: { 'x-forwarded-for': addr } })
    })
    // the last fetch of the budget succeeds (successes count)
    await assertReachesInteraction(from(ids[0], ip))
    // another document is refused without being fetched
    assert.equal(await authorizeRenderedError(from(ids[1], ip)), 'invalid_client')
    // a cached document needs no fetch
    await assertReachesInteraction(from(ids[0], ip))
    // another address is not affected
    await assertReachesInteraction(from(ids[2], '10.90.0.2'))
  })

  test('a dcr client with an https redirect refuses a different port', async () => {
    const res = await register({ client_name: 'Agent', redirect_uris: ['https://agent.example.org:8443/cb'] })
    assert.equal(res.status, 201, JSON.stringify(res.data))
    const clientId = res.data.client_id
    await assertReachesInteraction(flow(clientId, 'https://agent.example.org:8443/cb'))
    for (const variant of ['https://agent.example.org:9443/cb', 'https://agent.example.org/cb', 'https://agent.example.org:8443/cb/', 'https://agent.example.org:8443/CB', 'https://agent.example.org:8443/cb?x=1']) {
      assert.equal(await authorizeRenderedError(flow(clientId, variant)), 'invalid_redirect_uri', variant)
    }

    // a loopback uri next to an https one is matched exactly too
    const mixed = await register({ client_name: 'Mixed', application_type: 'native', redirect_uris: ['https://agent.example.org/cb', 'http://localhost:5000/cb'] })
    assert.equal(mixed.status, 201, JSON.stringify(mixed.data))
    assert.equal(mixed.data.application_type, 'web')
    await assertReachesInteraction(flow(mixed.data.client_id, 'http://localhost:5000/cb'))
    assert.equal(await authorizeRenderedError(flow(mixed.data.client_id, 'http://localhost:5001/cb')), 'invalid_redirect_uri')
  })

  test('cleanup deletes old dcr clients without grants', async () => {
    const ids: string[] = []
    for (let i = 0; i < 3; i++) {
      const res = await register(claudeCode())
      assert.equal(res.status, 201, JSON.stringify(res.data))
      ids.push(res.data.client_id)
    }
    const [oldUnused, oldGranted, recent] = ids
    const old = new Date(Date.now() - 31 * 86400000)
    await withMongo(async (db) => {
      await db.collection<any>('oauth-client').updateMany({ _id: { $in: [oldUnused, oldGranted] } }, { $set: { createdAt: old } })
      await db.collection<any>('oauth-grants').insertOne({
        _id: 'test_dcr_grant',
        issuer,
        clientId: oldGranted,
        clientName: 'Claude Code',
        clientKind: 'dcr',
        subject: { type: 'nhi', id: 'nhi-x' },
        account: { type: 'organization', id: 'x' },
        scope: 'organizations:read',
        resources: [issuer],
        authorizedBy: { id: 'x', name: 'x' },
        createdAt: old,
        expiresAt: new Date(Date.now() + 86400000)
      })
    })
    await testEnvAx.post('/run-user-cleanup')
    const remaining = await withMongo(db => db.collection<any>('oauth-client').find({}, { projection: { _id: 1 } }).toArray())
    assert.deepEqual(remaining.map(c => c._id).sort(), [oldGranted, recent].sort())
    // the deleted client is unknown to the provider
    assert.equal(await authorizeRenderedError(flow(oldUnused, 'http://localhost/callback')), 'invalid_client')
  })
})
