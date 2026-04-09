import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx, createUser, directoryUrl, mockOidcControlUrl2 } from '../support/axios.ts'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { CookieJar } from 'tough-cookie'

// The coreIdProvider is configured on MOCK_OIDC_PORT2 in development.cjs
const mockOidcPort = parseInt(process.env.MOCK_OIDC_PORT2 || '8999')

test.describe('global OIDC configuration in coreIdProvider mode', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/userinfo', {
      sub: 'testoidc1',
      email: 'oidc1@test.com',
      given_name: 'Test',
      family_name: 'Oidc1'
    })
    // short expiration (1s) to test token refresh on keepalive
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/token-config', { expires_in: 1 })
  })
  test.afterEach(async () => {
    await axiosBuilder().delete(mockOidcControlUrl2 + '/_test')
  })

  test('should implement a standard login workflow', async () => {
    const anonymousAx = await axios()
    const { ax: adminAx } = await createUser('admin@test.com', true)

    const providers = (await anonymousAx.get('/api/auth/providers')).data
    assert.ok(providers.find((p: any) => p.id === 'github'))
    assert.ok(providers.find((p: any) => p.id === 'localhost' + mockOidcPort))

    // request a login from the provider
    const loginInitial = await anonymousAx.get(`/api/auth/oauth/localhost${mockOidcPort}/login`, { validateStatus: (status: number) => status === 302 })
    const providerAuthUrl = new URL(loginInitial.headers.location)
    // redirect to the provider with proper params
    assert.equal(providerAuthUrl.host, 'localhost:' + mockOidcPort)
    assert.equal(providerAuthUrl.pathname, '/authorize')
    assert.equal(providerAuthUrl.searchParams.get('redirect_uri'), directoryUrl + '/api/auth/oauth-callback')
    // successful login on the provider followed by redirect to our callback url
    const loginProvider = await anonymousAx(providerAuthUrl.href, { validateStatus: (status: number) => status === 302 })
    const providerAuthRedirect = new URL(loginProvider.headers.location)
    assert.equal(providerAuthRedirect.pathname, '/simple-directory/api/auth/oauth-callback')
    // open our callback url that produces a temporary token to be transformed in a session token by a token_callback url
    const oauthCallback = await anonymousAx(providerAuthRedirect.href, { validateStatus: (status: number) => status === 302 })
    const callbackRedirect = new URL(oauthCallback.headers.location)
    assert.equal(callbackRedirect.pathname, '/simple-directory/api/auth/token_callback')
    // finally the token_callback url will set cookies and redirect to our final destination
    const tokenCallback = await anonymousAx(callbackRedirect.href, { validateStatus: (status: number) => status === 302 })
    assert.equal(tokenCallback.headers['set-cookie']?.length, 6)
    const cookieJar = new CookieJar()
    const cookieUrl = directoryUrl + '/'
    for (const cookie of tokenCallback.headers['set-cookie']) {
      cookieJar.setCookie(cookie, cookieUrl)
    }
    let me = (await anonymousAx.get('/api/auth/me', { headers: { Cookie: await cookieJar.getCookieString(cookieUrl) } })).data
    assert.equal(me.email, 'oidc1@test.com')
    assert.equal(me.name, 'Test Oidc1')

    const oauthTokens = (await adminAx.get('/api/oauth-tokens')).data?.results
    assert.equal(oauthTokens?.length, 1)

    // Update userinfo before keepalive triggers a refresh
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/userinfo', {
      sub: 'testoidc1',
      email: 'oidc1@test.com',
      given_name: 'Test',
      family_name: 'Oidc2'
    })

    await new Promise(resolve => setTimeout(resolve, 1100))
    const keepalive = await anonymousAx.post('/api/auth/keepalive', undefined, { headers: { Cookie: await cookieJar.getCookieString(cookieUrl) } })
    assert.equal(keepalive.headers['set-cookie']?.length, 6)
    for (const cookie of keepalive.headers['set-cookie']) {
      cookieJar.setCookie(cookie, cookieUrl)
    }

    const oauthTokens2 = (await adminAx.get('/api/oauth-tokens')).data?.results
    assert.equal(oauthTokens2?.length, 1)
    assert.ok(oauthTokens2[0].token.expires_at > oauthTokens[0].token.expires_at)

    me = (await anonymousAx.get('/api/auth/me', { headers: { Cookie: await cookieJar.getCookieString(cookieUrl) } })).data
    assert.equal(me.email, 'oidc1@test.com')
    assert.equal(me.name, 'Test Oidc2')
  })
})
