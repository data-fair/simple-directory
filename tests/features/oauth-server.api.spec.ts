import { strict as assert } from 'node:assert'
import { randomUUID, createPublicKey } from 'node:crypto'
import { test } from '@playwright/test'
import jwt from 'jsonwebtoken'
import { axios, createUser, testEnvAx, devApiUrl, directoryUrl, getServerConfig } from '../support/axios.ts'
import { signAssertion, nhiBody, unbindNhi } from '../support/nhi.ts'

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

// the M1 shape of the server: authorization code flow off (dev and test turn it on)
const withCodeFlowOff = async (fn: () => Promise<void>) => {
  const oauthServer = (await testEnvAx.get('/config')).data.oauthServer
  await testEnvAx.patch('/config', { oauthServer: { ...oauthServer, authorizationCode: false } })
  try {
    await fn()
  } finally {
    await testEnvAx.patch('/config', { oauthServer })
  }
}

const createOrg = async (email: string, name: string) => {
  const { ax } = await createUser(email)
  return (await ax.post('/api/organizations', { name })).data
}

test.describe('oauth server', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('discovery on the main site', async () => withCodeFlowOff(async () => {
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
    // only what M1 serves: no DPoP, no revocation, no client secrets, no authorization response modes
    assert.deepEqual(discovery.token_endpoint_auth_methods_supported, ['private_key_jwt'])
    for (const key of ['dpop_signing_alg_values_supported', 'revocation_endpoint', 'response_modes_supported', 'authorization_response_iss_parameter_supported']) {
      assert.equal(discovery[key], undefined, key)
    }

    const oauthDiscovery = (await ax.get('/.well-known/oauth-authorization-server')).data
    assert.deepEqual(oauthDiscovery, discovery)
  }))

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
    for (const key of ['issuer', 'token_endpoint', 'jwks_uri']) {
      assert.equal(discovery[key].split('/portal/simple-directory').length, 2, `${key} = ${discovery[key]}`)
    }
  })

  test('authorize endpoint is 404 without the authorization code flow', async () => withCodeFlowOff(async () => {
    for (const path of ['/api/oauth/authorize', '/api/oauth/authorize/', '/api/oauth/Authorize']) {
      await assert.rejects(axios().get(path, { params: { client_id: 'x', response_type: 'code' } }),
        (err: any) => err.status === 404, path)
    }
  }))

  test('only the canonical routes that M1 serves reach the provider', async () => withCodeFlowOff(async () => {
    for (const path of ['/api/oauth/jwks', '/api/oauth/revoke', '/api/oauth/token/', '/.well-known/openid-configuration/', '/.well-known/OAuth-Authorization-Server']) {
      const err = await axios().post(path, 'token=x', { headers: { 'content-type': 'application/x-www-form-urlencoded' } }).catch(err => err)
      assert.equal(err.status, 404, path)
      await assert.rejects(axios().get(path), (err: any) => err.status === 404, path)
    }
  }))

  test('only the canonical routes of the code flow reach the provider', async () => {
    for (const path of ['/api/oauth/jwks', '/api/oauth/revoke/', '/api/oauth/Revoke', '/api/oauth/authorize/', '/api/oauth/Authorize', '/api/oauth/authorize/x', '/api/oauth/interaction/x']) {
      const err = await axios().post(path, 'token=x', { headers: { 'content-type': 'application/x-www-form-urlencoded' } }).catch(err => err)
      assert.equal(err.status, 404, path)
      await assert.rejects(axios().get(path), (err: any) => err.status === 404, path)
    }
  })

  test('the provider signs with the current scoped key, also after a rotation', async () => {
    const ax = axios()
    const { nhi } = await createNhi('oauth-rotation@test.com')
    const providerKid = async () => {
      const res = await ccRequest(nhi.id)
      assert.equal(res.status, 200, JSON.stringify(res.data))
      return (jwt.decode(res.data.access_token, { complete: true }) as any).header.kid
    }
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

const clientAssertionType = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'

// a private_key_jwt client assertion signed with the nhi's test key
const clientAssertion = (nhiId: string, claims: Record<string, any> = {}) =>
  signAssertion({ iss: nhiId, sub: nhiId, aud: directoryUrl + '/api/oauth/token', jti: randomUUID(), ...claims }, { expiresIn: 60 })

const ccRequest = (nhiId: string, params: Record<string, string> = {}, headers: Record<string, string> = {}, assertion = clientAssertion(nhiId)) =>
  tokenRequest({ grant_type: 'client_credentials', client_assertion_type: clientAssertionType, client_assertion: assertion, ...params }, headers)

test.describe('oauth server client_credentials grant', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { platformScopesUrl: `${devApiUrl}/api/test-env/platform-scopes` })
    await testEnvAx.put('/platform-scopes', { scopes: { datasets: 'All dataset scopes', 'datasets:read': 'Read datasets', 'datasets:write': 'Write datasets' } })
  })

  test.afterAll(async () => {
    await testEnvAx.patch('/config', { platformScopesUrl: '' })
  })

  test('client_credentials with private_key_jwt issues an at+jwt for the nhi', async () => {
    const { nhi, org } = await createNhi('oauth-cc1@test.com')
    const res = await ccRequest(nhi.id)
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.equal(res.data.token_type, 'Bearer')
    const { jwtDurations } = await getServerConfig()
    assert.ok(res.data.expires_in > 0 && res.data.expires_in <= jwtDurations.nhiToken)
    assert.equal(res.headers['cache-control'], 'no-store')
    assert.equal(res.headers['set-cookie'], undefined)
    const decoded = jwt.decode(res.data.access_token, { complete: true }) as any
    assert.equal(decoded.header.typ, 'at+jwt')
    assert.equal(decoded.header.alg, 'RS256')
    assert.ok(decoded.header.kid.startsWith('scoped-'))
    const payload = decoded.payload
    assert.equal(payload.iss, directoryUrl)
    assert.equal(payload.sub, nhi.id)
    assert.equal(payload.client_id, nhi.id)
    assert.equal(payload.aud, directoryUrl.replace('/simple-directory', ''))
    assert.equal(typeof payload.jti, 'string')
    assert.equal(payload.exp - payload.iat, jwtDurations.nhiToken)
    assert.equal(payload.nhi, 1)
    assert.equal(payload.organizations.length, 1)
    assert.equal(payload.organizations[0].id, org.id)
    assert.equal(payload.siteOwner, undefined)
    for (const key of ['isAdmin', 'adminMode', 'asAdmin', 'boundIp']) assert.equal(payload[key], undefined, key)
    assert.equal(Object.hasOwn(payload, 'scope'), false)
    assert.equal(res.data.scope, undefined)
    // the token verifies against the scoped jwks of the issuer
    const jwks = (await axios().get('/.well-known/scoped-jwks.json')).data
    const jwk = jwks.keys.find((k: any) => k.kid === decoded.header.kid)
    jwt.verify(res.data.access_token, createPublicKey({ key: jwk, format: 'jwk' }), { algorithms: ['RS256'] })
  })

  test('client_credentials: nhi claims and siteOwner on a site of the nhi org', async () => {
    const { nhi, org } = await createNhi('oauth-cc2@test.com')
    await postSite(org.id, org.name, {}, { authMode: 'onlyBackOffice' })
    const res = await ccRequest(nhi.id, { resource: site2Url })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    const payload = jwt.decode(res.data.access_token) as any
    assert.equal(payload.aud, site2Url)
    assert.equal(payload.nhi, 1)
    assert.equal(payload.organizations.length, 1)
    assert.deepEqual(payload.siteOwner, { type: 'organization', id: org.id, name: org.name })
  })

  test('client_credentials: site of another org is refused', async () => {
    const { nhi } = await createNhi('oauth-cc3@test.com')
    const otherOrg = await createOrg('oauth-cc3-other@test.com', 'Other CC org')
    await postSite(otherOrg.id, otherOrg.name, {}, { authMode: 'onlyBackOffice' })
    const res = await ccRequest(nhi.id, { resource: site2Url })
    assert.equal(res.status, 400)
    assert.equal(res.data.error, 'invalid_target')
  })

  test('client_credentials: mcp resource gives two audiences', async () => {
    const { nhi } = await createNhi('oauth-cc4@test.com')
    const siteUrl = directoryUrl.replace('/simple-directory', '')
    const res = await ccRequest(nhi.id, { resource: siteUrl + '/mcp-server/datasets' })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    const decoded = jwt.decode(res.data.access_token, { complete: true }) as any
    assert.equal(decoded.header.typ, 'at+jwt')
    assert.ok(decoded.header.kid.startsWith('scoped-'))
    assert.deepEqual(decoded.payload.aud, [siteUrl + '/mcp-server', siteUrl])
  })

  test('client_credentials: unknown resource is invalid_target', async () => {
    const { nhi } = await createNhi('oauth-cc5@test.com')
    const res = await ccRequest(nhi.id, { resource: 'http://unknown.example.com' })
    assert.equal(res.status, 400)
    assert.equal(res.data.error, 'invalid_target')
  })

  test('client_credentials: replayed client assertion is refused (invalid_client)', async () => {
    const { nhi } = await createNhi('oauth-cc6@test.com')
    const assertion = clientAssertion(nhi.id)
    const first = await ccRequest(nhi.id, {}, {}, assertion)
    assert.equal(first.status, 200, JSON.stringify(first.data))
    const replay = await ccRequest(nhi.id, {}, {}, assertion)
    assert.equal(replay.status, 401)
    assert.equal(replay.data.error, 'invalid_client')
  })

  test('an nhi without key binding is refused by both machine grants', async () => {
    const { nhi } = await createNhi('oauth-nb@test.com')
    assert.equal((await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() })).status, 200)
    assert.equal((await ccRequest(nhi.id)).status, 200)
    await unbindNhi(nhi.id)
    const bearer = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() })
    assert.equal(bearer.status, 400)
    assert.equal(bearer.data.error, 'invalid_grant')
    const cc = await ccRequest(nhi.id)
    assert.equal(cc.status, 401)
    assert.equal(cc.data.error, 'invalid_client')
  })

  test('client_credentials: nhi without inline jwks is invalid_client', async () => {
    const { nhi } = await createNhi('oauth-cc7@test.com', { provider: { issuer: `http://localhost:${process.env.MOCK_OIDC_PORT1 || '8998'}` } })
    const res = await ccRequest(nhi.id)
    assert.equal(res.status, 401)
    assert.equal(res.data.error, 'invalid_client')
  })

  test('client_credentials: scope within the maximum', async () => {
    const { nhi } = await createNhi('oauth-cc8@test.com', { scopes: ['datasets'] })
    const res = await ccRequest(nhi.id, { scope: 'openid datasets:read' })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.equal(res.data.scope, 'datasets:read')
    assert.equal((jwt.decode(res.data.access_token) as any).scope, 'datasets:read')
    // nothing requested grants the maximum
    const max = await ccRequest(nhi.id)
    assert.equal(max.status, 200, JSON.stringify(max.data))
    assert.equal(max.data.scope, 'datasets')
    assert.equal((jwt.decode(max.data.access_token) as any).scope, 'datasets')
  })

  test('client_credentials: scope exceeding the maximum is invalid_scope', async () => {
    const { nhi } = await createNhi('oauth-cc9@test.com', { scopes: ['datasets:read'] })
    const res = await ccRequest(nhi.id, { scope: 'datasets:write' })
    assert.equal(res.status, 400)
    assert.equal(res.data.error, 'invalid_scope')
  })

  test('client_credentials: ipBinding puts boundIp', async () => {
    const { nhi } = await createNhi('oauth-cc10@test.com', { ipBinding: true })
    const res = await ccRequest(nhi.id, {}, { 'x-forwarded-for': '9.9.9.7' })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.equal((jwt.decode(res.data.access_token) as any).boundIp, '9.9.9.7')
  })

  test('client_credentials: allowedIps refusal is invalid_grant', async () => {
    const { nhi } = await createNhi('oauth-cc11@test.com', { allowedIps: ['9.9.9.9'] })
    const ok = await ccRequest(nhi.id, {}, { 'x-forwarded-for': '9.9.9.9' })
    assert.equal(ok.status, 200, JSON.stringify(ok.data))
    const res = await ccRequest(nhi.id, {}, { 'x-forwarded-for': '7.7.7.6' })
    assert.equal(res.status, 400)
    assert.equal(res.data.error, 'invalid_grant')
  })

  test('client_credentials: non canonical token paths are 404', async () => {
    const { nhi } = await createNhi('oauth-cc-paths@test.com')
    const params = { grant_type: 'client_credentials', client_assertion_type: clientAssertionType }
    for (const path of ['/api/oauth/token/', '/api/oauth/Token', '/api/oauth/TOKEN/']) {
      const res = await tokenRequest({ ...params, client_assertion: clientAssertion(nhi.id) }, {}, path)
      assert.equal(res.status, 404, path)
    }
    const res = await tokenRequest({ ...params, client_assertion: clientAssertion(nhi.id) })
    assert.equal(res.status, 200, JSON.stringify(res.data))
  })

  test('client_credentials: only failures count against the limiter', async () => {
    const { nhi } = await createNhi('oauth-cc12@test.com')
    const attempts = (await getServerConfig()).authRateLimit.attempts
    const from = { 'x-forwarded-for': '9.8.7.4' }
    for (let i = 0; i < attempts + 1; i++) {
      const res = await ccRequest(nhi.id, {}, from)
      assert.equal(res.status, 200, `attempt ${i}: ${JSON.stringify(res.data)}`)
    }
    for (let i = 0; i < attempts; i++) {
      const res = await ccRequest(nhi.id, {}, from, clientAssertion(nhi.id, { aud: 'https://other.example.com' }))
      assert.equal(res.status, 401, `failure ${i}: ${JSON.stringify(res.data)}`)
    }
    const limited = await ccRequest(nhi.id, {}, from)
    assert.equal(limited.status, 429)
    assert.equal(limited.headers['set-cookie'], undefined)
  })

  test('client_credentials: success records the last logged date of the nhi', async () => {
    const { ax, org, nhi } = await createNhi('oauth-cc13@test.com')
    const logged = async () => (await ax.get(`/api/organizations/${org.id}/nhis`)).data.results.find((r: any) => r.id === nhi.id).logged
    assert.equal(await logged(), undefined)
    const res = await ccRequest(nhi.id)
    assert.equal(res.status, 200, JSON.stringify(res.data))
    // updateNhiLogged is not awaited by the grant
    let value
    for (let i = 0; i < 20 && !value; i++) {
      value = await logged()
      if (!value) await new Promise(resolve => setTimeout(resolve, 50))
    }
    assert.ok(value, 'logged date set')
  })

  test('client_credentials: a user that is not an nhi is invalid_client', async () => {
    const { user } = await createUser('oauth-cc14@test.com')
    const res = await ccRequest(user.id)
    assert.equal(res.status, 401)
    assert.equal(res.data.error, 'invalid_client')
  })

  test('client_credentials: invalid_client without nhi support', async () => {
    const { nhi } = await createNhi('oauth-cc15@test.com')
    await testEnvAx.patch('/config', { manageNhis: false })
    try {
      const res = await ccRequest(nhi.id)
      assert.equal(res.status, 401)
      assert.equal(res.data.error, 'invalid_client')
    } finally {
      await testEnvAx.patch('/config', { manageNhis: true })
    }
  })

  test('nhi grants are not advertised without nhi support', async () => {
    await testEnvAx.patch('/config', { manageNhis: false })
    try {
      const discovery = (await axios().get('/.well-known/openid-configuration')).data
      assert.ok(!discovery.grant_types_supported.includes('client_credentials'))
      assert.ok(!discovery.grant_types_supported.includes(jwtBearer))
    } finally {
      await testEnvAx.patch('/config', { manageNhis: true })
    }
  })
})

test.describe('oauth server tokens used as bearer on sd', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { platformScopesUrl: `${devApiUrl}/api/test-env/platform-scopes` })
    await testEnvAx.put('/platform-scopes', { scopes: { 'organizations:read': 'Read organizations' } })
  })

  test.afterAll(async () => {
    await testEnvAx.patch('/config', { platformScopesUrl: '' })
  })

  const getOrg = (orgId: string, token: string) =>
    axios().get(`/api/organizations/${orgId}`, { headers: { authorization: `Bearer ${token}` } })

  test('token from the token endpoint is accepted as bearer by sd', async () => {
    const { nhi, org } = await createNhi('oauth-bearer1@test.com', { scopes: ['organizations:read'] })
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    const orgRes = await getOrg(org.id, res.data.access_token)
    assert.equal(orgRes.status, 200)
    assert.equal(orgRes.data.id, org.id)
  })

  test('mcp-resource token is accepted by sd', async () => {
    const { nhi, org } = await createNhi('oauth-bearer2@test.com', { scopes: ['organizations:read'] })
    const siteUrl = directoryUrl.replace('/simple-directory', '')
    const res = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion(), resource: siteUrl + '/mcp-server/datasets' })
    assert.equal(res.status, 200, JSON.stringify(res.data))
    assert.equal((await getOrg(org.id, res.data.access_token)).status, 200)
  })

  test('tokens survive a scoped key rotation', async () => {
    const { nhi, org } = await createNhi('oauth-bearer3@test.com', { scopes: ['organizations:read'] })
    const first = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() })
    assert.equal(first.status, 200, JSON.stringify(first.data))
    await testEnvAx.post('/rotate-keys')
    assert.equal((await getOrg(org.id, first.data.access_token)).status, 200)
    const second = await tokenRequest({ grant_type: jwtBearer, client_id: nhi.id, assertion: signAssertion() })
    assert.equal(second.status, 200, JSON.stringify(second.data))
    const kid = (t: string) => (jwt.decode(t, { complete: true }) as any).header.kid
    assert.notEqual(kid(second.data.access_token), kid(first.data.access_token))
    assert.equal((await getOrg(org.id, second.data.access_token)).status, 200)
  })
})
