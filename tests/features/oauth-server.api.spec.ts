import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import jwt from 'jsonwebtoken'
import { axios, createUser, testEnvAx, devApiUrl, directoryUrl, getServerConfig } from '../support/axios.ts'
import { signAssertion, nhiBody } from '../support/nhi.ts'

const site2Host = `127.0.0.1:${process.env.NGINX_PORT2}`
const site2Url = `http://${site2Host}`

// creates the site through the secret key route, then applies the auth settings as a superadmin
// (the POST body does not accept them)
const postSite = async (orgId: string, orgName: string, extra: Record<string, any>, patch: Record<string, any>) => {
  const config = await getServerConfig()
  await axios().post('/api/sites',
    { _id: 'test_oauth_site', owner: { type: 'organization', id: orgId, name: orgName }, host: site2Host, ...extra },
    { params: { key: config.secretKeys.sites } })
  const { ax: adminAx } = await createUser('admin@test.com', true)
  await adminAx.patch('/api/sites/test_oauth_site', patch)
  await testEnvAx.post('/clear-site-cache')
}

const createOrg = async (email: string, name: string) => {
  const { ax } = await createUser(email)
  return (await ax.post('/api/organizations', { name })).data
}

test.describe('oauth server', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('discovery on the main site', async () => {
    const ax = axios()
    const discovery = (await ax.get('/.well-known/openid-configuration')).data
    assert.equal(discovery.issuer, directoryUrl)
    assert.equal(discovery.token_endpoint, directoryUrl + '/api/oauth/token')
    assert.equal(discovery.jwks_uri, directoryUrl + '/.well-known/scoped-jwks.json')
    assert.ok(discovery.grant_types_supported.includes('client_credentials'))
    assert.ok(discovery.grant_types_supported.includes('urn:ietf:params:oauth:grant-type:jwt-bearer'))
    // M1 grants exactly, nothing advertised that is not served
    assert.deepEqual([...discovery.grant_types_supported].sort(), ['client_credentials', 'urn:ietf:params:oauth:grant-type:jwt-bearer'])
    for (const key of ['end_session_endpoint', 'userinfo_endpoint', 'pushed_authorization_request_endpoint', 'authorization_endpoint']) {
      assert.equal(discovery[key], undefined, key)
    }
    assert.deepEqual(discovery.code_challenge_methods_supported, ['S256'])
    assert.ok(discovery.token_endpoint_auth_methods_supported.includes('private_key_jwt'))

    const oauthDiscovery = (await ax.get('/.well-known/oauth-authorization-server')).data
    assert.deepEqual(oauthDiscovery, discovery)
  })

  test('discovery on an account main site', async () => {
    const org = await createOrg('oauth-server1@test.com', 'OAuth org 1')
    await postSite(org.id, org.name, {}, { isAccountMain: true })
    const discovery = (await axios().get(`${site2Url}/simple-directory/.well-known/openid-configuration`)).data
    assert.equal(discovery.issuer, 'http://127.0.0.1:' + process.env.NGINX_PORT2 + '/simple-directory')
    assert.equal(discovery.token_endpoint, discovery.issuer + '/api/oauth/token')
    assert.equal(discovery.jwks_uri, discovery.issuer + '/.well-known/scoped-jwks.json')
  })

  test('no oauth on a site that is not an issuer', async () => {
    const org = await createOrg('oauth-server2@test.com', 'OAuth org 2')
    await postSite(org.id, org.name, {}, { authMode: 'onlyOtherSite', authOnlyOtherSite: new URL(directoryUrl).host })
    const ax = axios()
    await assert.rejects(ax.get(`${site2Url}/simple-directory/.well-known/openid-configuration`), (err: any) => err.status === 404)
    await assert.rejects(ax.post(`${site2Url}/simple-directory/api/oauth/token`, 'grant_type=client_credentials',
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } }), (err: any) => err.status === 404)
  })

  test('no oauth when disabled', async () => {
    const oauthServer = (await testEnvAx.get('/config')).data.oauthServer
    assert.ok(oauthServer?.enabled)
    await testEnvAx.patch('/config', { oauthServer: { ...oauthServer, enabled: false } })
    try {
      await assert.rejects(axios().get('/.well-known/openid-configuration'), (err: any) => err.status === 404)
      await assert.rejects(axios().get('/.well-known/oauth-authorization-server'), (err: any) => err.status === 404)
    } finally {
      await testEnvAx.patch('/config', { oauthServer })
    }
  })

  test('discovery on a site with a path', async () => {
    const org = await createOrg('oauth-server3@test.com', 'OAuth org 3')
    await postSite(org.id, org.name, { path: '/portal' }, { isAccountMain: true })
    const discovery = (await axios().get(devApiUrl + '/portal/simple-directory/.well-known/openid-configuration', {
      headers: { 'x-forwarded-host': site2Host, 'x-forwarded-proto': 'http' }
    })).data
    const expectedIssuer = site2Url + '/portal/simple-directory'
    assert.equal(discovery.issuer, expectedIssuer)
    assert.equal(discovery.token_endpoint, expectedIssuer + '/api/oauth/token')
    assert.equal(discovery.jwks_uri, expectedIssuer + '/.well-known/scoped-jwks.json')
    for (const key of ['issuer', 'token_endpoint', 'jwks_uri', 'revocation_endpoint']) {
      assert.equal(discovery[key].split('/portal/simple-directory').length, 2, `${key} = ${discovery[key]}`)
    }
  })

  test('authorize endpoint is 404 in M1', async () => {
    await assert.rejects(axios().get('/api/oauth/authorize', { params: { client_id: 'x', response_type: 'code' } }),
      (err: any) => err.status === 404)
  })

  test('the provider signs with the current scoped key, also after a rotation', async () => {
    const ax = axios()
    const providerKid = async () => (await ax.get('/api/oauth/jwks')).data.keys[0].kid
    const scopedKid = async () => (await ax.get('/.well-known/scoped-jwks.json')).data.keys[0].kid
    const kid1 = await scopedKid()
    assert.ok(kid1.startsWith('scoped-'))
    assert.equal(await providerKid(), kid1)
    await testEnvAx.post('/rotate-keys')
    const kid2 = await scopedKid()
    assert.notEqual(kid2, kid1)
    assert.equal(await providerKid(), kid2)
  })

  test('unknown oauth paths are 404, token endpoint is reachable without cookies', async () => {
    await assert.rejects(axios().get('/api/oauth/nothing-here'), (err: any) => err.status === 404)
    // no client authentication: the provider itself answers with an oauth error, not SD's session layer
    const err = await axios().post('/api/oauth/token', 'grant_type=client_credentials',
      { headers: { 'content-type': 'application/x-www-form-urlencoded' } }).catch(err => err)
    assert.ok([400, 401].includes(err.status), `status ${err.status}`)
    assert.ok(err.data?.error, JSON.stringify(err.data))
  })
})

const jwtBearer = 'urn:ietf:params:oauth:grant-type:jwt-bearer'

// posts a form-encoded token request, resolves with the response or the error alike
const tokenRequest = (params: Record<string, string>, headers: Record<string, string> = {}, url = '/api/oauth/token') =>
  axios().post(url, new URLSearchParams(params).toString(),
    { headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers } })
    .then((r: any) => r, (e: any) => e)

const createNhi = async (email: string, extra: Record<string, any> = {}) => {
  const { ax } = await createUser(email)
  const org = (await ax.post('/api/organizations', { name: 'NHI ' + email })).data
  ax.setOrg(org.id)
  const nhi = (await ax.post(`/api/organizations/${org.id}/nhis`, nhiBody(extra))).data
  return { ax, org, nhi }
}

test.describe('oauth server jwt bearer grant', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { platformScopesUrl: `${devApiUrl}/api/test-env/platform-scopes` })
    await testEnvAx.put('/platform-scopes', { scopes: { datasets: 'All dataset scopes', 'datasets:read': 'Read datasets', 'datasets:write': 'Write datasets' } })
  })

  test.afterAll(async () => {
    await testEnvAx.patch('/config', { platformScopesUrl: '' })
  })

  test('jwt bearer grant issues an at+jwt with rfc 9068 claims', async () => {
    const { nhi, org } = await createNhi('oauth-jwt1@test.com')
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.equal(res.data.token_type, 'Bearer')
    assert.ok(res.data.expires_in > 0 && res.data.expires_in <= 10 * 60)
    assert.equal(res.headers['cache-control'], 'no-store')
    assert.equal(res.headers['set-cookie'], undefined)
    const decoded = jwt.decode(res.data.access_token, { complete: true }) as any
    assert.equal(decoded.header.typ, 'at+jwt')
    assert.ok(decoded.header.kid.startsWith('scoped-'))
    const payload = decoded.payload
    assert.equal(payload.iss, directoryUrl)
    assert.equal(payload.sub, nhi.id)
    assert.equal(payload.client_id, nhi.id)
    assert.equal(payload.aud, directoryUrl.replace('/simple-directory', ''))
    assert.equal(typeof payload.jti, 'string')
    assert.equal(payload.nhi, 1)
    assert.equal(payload.organizations.length, 1)
    assert.equal(payload.organizations[0].id, org.id)
    assert.equal(payload.isAdmin, undefined)
    assert.equal(payload.scope, undefined)
    assert.equal(res.data.scope, undefined)
  })

  test('jwt bearer grant: requested scope within the maximum', async () => {
    const { nhi } = await createNhi('oauth-jwt2@test.com', { scopes: ['datasets'] })
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion(), scope: 'datasets:read' })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.equal(res.data.scope, 'datasets:read')
    assert.equal((jwt.decode(res.data.access_token) as any).scope, 'datasets:read')
    // nothing requested grants the maximum
    const max = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() })
    assert.equal(max.data.scope, 'datasets')
  })

  test('jwt bearer grant: exceeding scope is invalid_scope', async () => {
    const { nhi } = await createNhi('oauth-jwt3@test.com', { scopes: ['datasets:read'] })
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion(), scope: 'datasets:write' })
    assert.equal(res.status, 400)
    assert.equal(res.data.error, 'invalid_scope')
  })

  test('jwt bearer grant: openid is stripped', async () => {
    const { nhi } = await createNhi('oauth-jwt4@test.com', { scopes: ['datasets'] })
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion(), scope: 'openid datasets:read profile' })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.equal(res.data.scope, 'datasets:read')
    assert.equal((jwt.decode(res.data.access_token) as any).scope, 'datasets:read')
    // only OIDC values means nothing requested: the maximum
    const onlyOidc = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion(), scope: 'openid' })
    assert.equal(onlyOidc.status, 200, JSON.stringify(onlyOidc.data))
    assert.equal(onlyOidc.data.scope, 'datasets')
  })

  test('jwt bearer grant: no maximum and nothing requested means no scope claim', async () => {
    const { nhi } = await createNhi('oauth-jwt5@test.com')
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion(), scope: 'openid offline_access' })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.equal(res.data.scope, undefined)
    assert.equal(Object.hasOwn(jwt.decode(res.data.access_token) as any, 'scope'), false)
  })

  test('jwt bearer grant: mcp resource gives two audiences', async () => {
    const { nhi } = await createNhi('oauth-jwt6@test.com')
    const siteUrl = directoryUrl.replace('/simple-directory', '')
    // config.mcpPath default (not exposed by the test-env config route)
    const mcpPath = '/mcp-server'
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion(), resource: siteUrl + mcpPath + '/datasets' })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.deepEqual((jwt.decode(res.data.access_token) as any).aud, [siteUrl + mcpPath, siteUrl])
  })

  test('jwt bearer grant: unknown resource is invalid_target', async () => {
    const { nhi } = await createNhi('oauth-jwt7@test.com')
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion(), resource: 'http://unknown.example.com' })
    assert.equal(res.status, 400)
    assert.equal(res.data.error, 'invalid_target')
  })

  test('jwt bearer grant: wrong audience, unknown client, other org site, ip not allowed all give the same invalid_grant', async () => {
    const { nhi } = await createNhi('oauth-jwt8@test.com', { allowedIps: ['9.9.9.9', '8.8.8.8'] })
    const from = { 'x-forwarded-for': '9.9.9.9' }
    // sanity: the same request with a valid assertion from an allowed ip succeeds
    const ok = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() }, from)
    assert.equal(ok.status, 200, JSON.stringify(ok.data))

    const otherOrg = await createOrg('oauth-jwt8-other@test.com', 'Other NHI org')
    await postSite(otherOrg.id, otherOrg.name, {}, { authMode: 'onlyBackOffice' })

    const failures = [
      await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion({ aud: 'https://other.example.com' }) }, from),
      await tokenRequest({ grant_type: jwtBearer, client_id: 'nhi-unknown000', assertion: signAssertion() }, from),
      await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion(), resource: site2Url }, from),
      await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() }, { 'x-forwarded-for': '7.7.7.7' })
    ]
    for (const res of failures) {
      assert.equal(res.status, 400)
      assert.deepEqual(res.data, { error: 'invalid_grant' })
      assert.equal(res.headers['set-cookie'], undefined)
    }
  })

  test('jwt bearer grant: json body is invalid_request', async () => {
    const { nhi } = await createNhi('oauth-jwt9@test.com')
    const res = await axios().post('/api/oauth/token', { grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() })
      .then((r: any) => r, (e: any) => e)
    assert.equal(res.status, 400)
    assert.equal(res.data.error, 'invalid_request')
  })

  test('jwt bearer grant: only failures count against the limiter', async () => {
    const { nhi } = await createNhi('oauth-jwt10@test.com')
    const attempts = (await getServerConfig()).authRateLimit.attempts
    const from = { 'x-forwarded-for': '9.8.7.5' }
    for (let i = 0; i < attempts + 1; i++) {
      const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() }, from)
      assert.equal(res.status, 200, `attempt ${i}: ${JSON.stringify(res.data)}`)
    }
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() }, from)
    assert.equal(res.status, 200, JSON.stringify(res.data))
  })
})
