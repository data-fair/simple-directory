import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, createUser, testEnvAx, devApiUrl, directoryUrl, getServerConfig } from '../support/axios.ts'

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
