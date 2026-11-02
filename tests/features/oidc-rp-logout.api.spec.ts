import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, loginBindingCookie, testEnvAx, createUser, getServerConfig, mockOidcControlUrl1, loginWithOIDC } from '../support/axios.ts'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'

// RP-initiated logout: a user who logged in through an OIDC provider with rpInitiatedLogout is sent to the
// end_session_endpoint of the provider (with his id_token) when he logs out
const mockOidcPort = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')
const host = `127.0.0.1:${process.env.NGINX_PORT2}`
const siteUrl = `http://${host}/simple-directory`
const providerId = 'localhost' + mockOidcPort
const userinfo = { sub: 'testrplogout1', email: 'rplogout1@test.com', email_verified: true, given_name: 'Rp', family_name: 'Logout' }

const setupSite = async (rpInitiatedLogout: boolean) => {
  const config = await getServerConfig()
  const adminAx = (await createUser('admin@test.com', true)).ax
  const org = (await adminAx.post('/api/organizations', { name: 'Rp Logout Org' })).data
  const owner = { type: 'organization', id: org.id, name: org.name }
  await (await axios()).post('/api/sites',
    { _id: 'test_rplogout_site', owner, host, theme: { primaryColor: '#000000' } },
    { params: { key: config.secretKeys.sites } })
  await adminAx.patch('/api/sites/test_rplogout_site', {
    authMode: 'onlyLocal',
    authProviders: [{
      type: 'oidc',
      title: 'Rp Logout Idp',
      discovery: `http://localhost:${mockOidcPort}/.well-known/openid-configuration`,
      client: { id: 'test-client', secret: 'test-secret' },
      rpInitiatedLogout,
      createMember: { type: 'always' }
    }]
  })
  await testEnvAx.post('/clear-site-cache')
  return adminAx
}

// full login on the site, returns an axios instance carrying the session cookies
const siteLogin = async () => {
  const siteAx = await axios({ baseURL: siteUrl })
  const loginInitial = await siteAx.get(`/api/auth/oidc/${providerId}/login`, { validateStatus: (s: number) => s === 302 })
  const loginProvider = await siteAx(loginInitial.headers.location, { validateStatus: (s: number) => s === 302 })
  const oauthCallback = await siteAx(loginProvider.headers.location, { headers: { Cookie: loginBindingCookie(loginInitial) }, validateStatus: (s: number) => s === 302 })
  const tokenCallback = await siteAx(oauthCallback.headers.location, { validateStatus: (s: number) => s === 302 })
  const cookie = (tokenCallback.headers['set-cookie'] as string[]).map(c => c.split(';')[0]).join('; ')
  siteAx.defaults.headers.Cookie = cookie
  return siteAx
}

test.describe('RP-initiated logout', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/userinfo', userinfo)
  })
  test.afterEach(async () => {
    await axiosBuilder().delete(mockOidcControlUrl1 + '/_test')
  })

  test('should answer an end session url when the provider has rpInitiatedLogout', async () => {
    await setupSite(true)
    const siteAx = await siteLogin()
    const res = await siteAx.delete('/api/auth')
    assert.equal(res.status, 200)
    const url = new URL(res.data.endSessionUrl)
    assert.equal(url.origin + url.pathname, `http://localhost:${mockOidcPort}/endsession`)
    const idToken = url.searchParams.get('id_token_hint')!
    assert.ok(idToken)
    assert.equal(JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString()).iss, `http://localhost:${mockOidcPort}`)
    assert.equal(url.searchParams.get('client_id'), 'test-client')
    assert.equal(url.searchParams.get('post_logout_redirect_uri'), siteUrl + '/api/auth/oidc-logout-callback')
    assert.ok(url.searchParams.get('state'))

    // the post logout url goes back to the site
    const back = await siteAx.get('/api/auth/oidc-logout-callback', { maxRedirects: 0, validateStatus: (s: number) => s === 302 })
    assert.equal(back.headers.location, `http://${host}/`)

    // the session is gone
  })

  test('should answer 204 when the flag is off', async () => {
    await setupSite(false)
    const siteAx = await siteLogin()
    const res = await siteAx.delete('/api/auth')
    assert.equal(res.status, 204)
  })

  test('should answer 204 on a root provider that did not enable the flag', async () => {
    const ax = await loginWithOIDC(mockOidcPort)
    const res = await ax.delete('/api/auth')
    assert.equal(res.status, 204)
  })

  test('should not expose the id_token of the provider in the user document', async () => {
    const adminAx = await setupSite(true)
    const siteAx = await siteLogin()
    const me = (await siteAx.get('/api/auth/me')).data
    assert.ok(me.id)
    for (const ax of [siteAx, adminAx]) {
      const user = (await ax.get(`/api/users/${me.id}`)).data
      assert.ok(user.sessions.length >= 1)
      assert.ok(!JSON.stringify(user).includes('idToken'))
      assert.ok(!JSON.stringify(user).includes('id_token_hint'))
    }
  })
})
