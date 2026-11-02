import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, loginBindingCookie, testEnvAx, createUser, loginWithOIDC, mockOidcControlUrl1, mockOidcControlUrl2 } from '../support/axios.ts'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'

const mockOidcPort1 = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')
const mockOidcPort2 = parseInt(process.env.MOCK_OIDC_PORT2 || '8999')

const oidcUserInfo1 = { sub: 'testoidc1', email: 'oidc1@test.com', email_verified: true, given_name: 'OIDC', family_name: 'Test', role: 'contrib' }
const oidcUserInfo2 = { sub: 'testoidc2', email: 'oidc2@test.com', email_verified: true, given_name: 'OIDC', family_name: 'Test', role: 'contrib' }

test.describe('global OIDC configuration', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/userinfo', oidcUserInfo1)
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/userinfo', oidcUserInfo2)
    await testEnvAx.patch('/config', { defaultOrg: 'test_org1', defaultRolesLabels: {} })
  })
  test.afterEach(async () => {
    await axiosBuilder().delete(mockOidcControlUrl1 + '/_test')
    await axiosBuilder().delete(mockOidcControlUrl2 + '/_test')
    await testEnvAx.patch('/config', { defaultOrg: 'admins-org', defaultRolesLabels: { admin: 'Administrateur' } })
  })

  test('should implement a standard login workflow', async () => {
    const { ax } = await createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test', id: 'test_org1', roles: ['admin', 'user', 'contrib'] })

    const anonymousAx = await axios()
    const providers = (await anonymousAx.get('/api/auth/providers')).data
    assert.ok(providers.find((p: any) => p.id === 'github'))
    assert.ok(providers.find((p: any) => p.id === 'localhost' + mockOidcPort1))

    const ax1 = await loginWithOIDC(mockOidcPort1)
    const me = (await ax1.get('/api/auth/me')).data
    assert.equal(me.email, 'oidc1@test.com')
    assert.equal(me.name, 'OIDC Test')
    assert.equal(me.readOnly, undefined)
    assert.deepEqual(me.organizations, [{ id: 'test_org1', name: 'test', role: 'contrib', dflt: 1 }])

    // by default the info is not synced on next login
    await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/userinfo', { ...oidcUserInfo1, family_name: 'Test2', role: 'admin' })
    const ax2 = await loginWithOIDC(mockOidcPort1)
    const me2 = (await ax2.get('/api/auth/me')).data
    assert.equal(me2.email, 'oidc1@test.com')
    assert.equal(me2.name, 'OIDC Test')
    assert.deepEqual(me2.organizations, [{ id: 'test_org1', name: 'test', role: 'contrib', dflt: 1 }])
  })

  test('should send a nonce and check it in the id_token', async () => {
    const anonymousAx = await axios()
    const loginInitial = await anonymousAx.get(`/api/auth/oauth/localhost${mockOidcPort1}/login`, { validateStatus: (status: number) => status === 302 })
    const providerAuthUrl = new URL(loginInitial.headers.location)
    const nonce = providerAuthUrl.searchParams.get('nonce')
    assert.ok(nonce && nonce.length >= 32)
    // rejected by ProConnect, and the default value anyway
    assert.equal(providerAuthUrl.searchParams.get('display'), null)
    assert.equal(providerAuthUrl.searchParams.get('scope'), 'openid email profile')

    // the provider puts a nonce that does not match the relay state in the id_token
    providerAuthUrl.searchParams.set('nonce', 'tampered-' + nonce)
    const loginProvider = await anonymousAx(providerAuthUrl.href, { validateStatus: (status: number) => status === 302 })
    const oauthCallback = await anonymousAx(loginProvider.headers.location, { headers: { Cookie: loginBindingCookie(loginInitial) }, validateStatus: (status: number) => status === 302 })
    const callbackRedirect = new URL(oauthCallback.headers.location)
    assert.equal(callbackRedirect.pathname, '/simple-directory/login')
    assert.equal(callbackRedirect.searchParams.get('error'), 'badIDPResponse')
  })

  let orgReady = false
  test.beforeEach(() => { orgReady = false })
  const startLogin = async () => {
    // the oidc user joins this organization on login
    if (!orgReady) {
      const { ax } = await createUser('test-org@test.com')
      await ax.post('/api/organizations', { name: 'test', id: 'test_org1', roles: ['admin', 'user', 'contrib'] })
      orgReady = true
    }
    const anonymousAx = await axios()
    const loginInitial = await anonymousAx.get(`/api/auth/oauth/localhost${mockOidcPort1}/login`, { validateStatus: (status: number) => status === 302 })
    const providerAuthUrl = new URL(loginInitial.headers.location)
    const loginProvider = await anonymousAx(providerAuthUrl.href, { validateStatus: (status: number) => status === 302 })
    return { anonymousAx, loginInitial, providerAuthUrl, callbackUrl: loginProvider.headers.location as string }
  }
  const callback = (anonymousAx: any, url: string, cookie?: string) =>
    anonymousAx(url, { headers: cookie ? { Cookie: cookie } : {}, validateStatus: (status: number) => status === 302 })

  test('should send a PKCE S256 challenge and bind the login to the browser with a cookie', async () => {
    const { loginInitial, providerAuthUrl } = await startLogin()
    assert.ok(providerAuthUrl.searchParams.get('code_challenge'))
    assert.equal(providerAuthUrl.searchParams.get('code_challenge_method'), 'S256')
    const state = providerAuthUrl.searchParams.get('state')
    const setCookie = (loginInitial.headers['set-cookie'] as string[]).find(c => c.startsWith(`sd_login_${state}=`))
    assert.ok(setCookie)
    assert.match(setCookie, /httponly/i)
    assert.match(setCookie, /path=\/simple-directory\/api\/auth\//)
  })

  test('should refuse a callback without the binding cookie', async () => {
    const { anonymousAx, callbackUrl } = await startLogin()
    const res = await callback(anonymousAx, callbackUrl)
    const redirect = new URL(res.headers.location)
    assert.equal(redirect.pathname, '/simple-directory/login')
    assert.equal(redirect.searchParams.get('error'), 'badIDPResponse')
  })

  test('should refuse a callback with the binding cookie of another login', async () => {
    const login1 = await startLogin()
    const login2 = await startLogin()
    const state1 = login1.providerAuthUrl.searchParams.get('state')
    const state2 = login2.providerAuthUrl.searchParams.get('state')
    const cookie2 = loginBindingCookie(login2.loginInitial).replace(`sd_login_${state2}`, `sd_login_${state1}`)
    const res = await callback(login1.anonymousAx, login1.callbackUrl, cookie2)
    assert.equal(new URL(res.headers.location).searchParams.get('error'), 'badIDPResponse')
  })

  test('should accept a relay state only once', async () => {
    const { anonymousAx, loginInitial, callbackUrl } = await startLogin()
    const cookie = loginBindingCookie(loginInitial)
    const res1 = await callback(anonymousAx, callbackUrl, cookie)
    assert.equal(new URL(res1.headers.location).pathname, '/simple-directory/api/auth/token_callback')
    const res2 = await callback(anonymousAx, callbackUrl, cookie)
    assert.equal(new URL(res2.headers.location).searchParams.get('error'), 'badIDPResponse')
  })

  test('should accept two logins started before either callback', async () => {
    const login1 = await startLogin()
    const login2 = await startLogin()
    const res2 = await callback(login2.anonymousAx, login2.callbackUrl, loginBindingCookie(login2.loginInitial))
    assert.equal(new URL(res2.headers.location).pathname, '/simple-directory/api/auth/token_callback')
    const res1 = await callback(login1.anonymousAx, login1.callbackUrl, loginBindingCookie(login1.loginInitial))
    assert.equal(new URL(res1.headers.location).pathname, '/simple-directory/api/auth/token_callback')
  })

  test('should refuse a callback whose iss does not match the provider issuer', async () => {
    await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/authorize-redirect', { iss: 'http://evil.example.com' })
    const login = await startLogin()
    const url = new URL(login.callbackUrl)
    assert.equal(url.searchParams.get('iss'), 'http://evil.example.com')
    const res = await callback(login.anonymousAx, login.callbackUrl, loginBindingCookie(login.loginInitial))
    assert.equal(new URL(res.headers.location).searchParams.get('error'), 'badIDPResponse')
  })

  test('should read the last name from usual_name (ProConnect)', async () => {
    const { ax } = await createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test', id: 'test_org1', roles: ['admin', 'user', 'contrib'] })
    const { family_name: _, ...proConnectUserInfo } = oidcUserInfo1
    await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/userinfo', { ...proConnectUserInfo, usual_name: 'Usual' })
    const ax1 = await loginWithOIDC(mockOidcPort1)
    const me = (await ax1.get('/api/auth/me')).data
    assert.equal(me.email, 'oidc1@test.com')
    assert.equal(me.name, 'OIDC Usual')
  })

  test('should implement a standard login workflow on a core id provider', async () => {
    const { ax } = await createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test', id: 'test_org1', roles: ['admin', 'user', 'contrib'] })

    const anonymousAx = await axios()
    const providers = (await anonymousAx.get('/api/auth/providers')).data
    assert.ok(providers.find((p: any) => p.id === 'github'))
    assert.ok(providers.find((p: any) => p.id === 'localhost' + mockOidcPort1))

    const ax1 = await loginWithOIDC(mockOidcPort2)
    const me = (await ax1.get('/api/auth/me')).data
    assert.equal(me.email, 'oidc2@test.com')
    assert.equal(me.name, 'OIDC Test')
    assert.deepEqual(me.organizations, [{ id: 'test_org1', name: 'test', role: 'contrib', dflt: 1, readOnly: true }])

    // the info is synced on next login
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/userinfo', { ...oidcUserInfo2, family_name: 'Test2', role: 'admin' })
    const ax2 = await loginWithOIDC(mockOidcPort2)
    const me2 = (await ax2.get('/api/auth/me')).data
    assert.equal(me2.email, 'oidc2@test.com')
    assert.equal(me2.name, 'OIDC Test2')
    assert.deepEqual(me2.organizations, [{ id: 'test_org1', name: 'test', role: 'admin', dflt: 1, readOnly: true }])
  })
})
