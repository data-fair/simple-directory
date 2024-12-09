import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, clean, startApiServer, stopApiServer } from './utils/index.ts'
import { OAuth2Server } from 'oauth2-mock-server'
import { CookieJar } from 'tough-cookie'

process.env.STORAGE_TYPE = 'mongo'
process.env.OAUTH_PROVIDERS = '["github"]'
process.env.OIDC_PROVIDERS = JSON.stringify([{
  title: 'Test provider',
  discovery: 'http://localhost:8998/.well-known/openid-configuration',
  client: {
    id: 'test-client',
    secret: 'test-secret'
  }
}])

describe('global OIDC configuration', () => {
  let oauthServer: OAuth2Server
  before(async () => {
    oauthServer = new OAuth2Server()
    await oauthServer.issuer.keys.generate('RS256')
    oauthServer.service.once('beforeUserinfo', (userInfoResponse, req) => {
      userInfoResponse.body = { sub: 'testoidc1', email: 'oidc1@test.com' }
    })
    await oauthServer.start(8998, 'localhost')
  })
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)
  after(async () => {
    await oauthServer.stop()
  })

  it('should implement a standard login workflow', async () => {
    const anonymousAx = await axios()
    const providers = (await anonymousAx.get('/api/auth/providers')).data
    assert.ok(providers.find(p => p.id === 'github'))
    assert.ok(providers.find(p => p.id === 'localhost8998'))

    // request a login from the provider
    const loginInitial = await anonymousAx.get('/api/auth/oauth/localhost8998/login', { validateStatus: (status) => status === 302 })
    const providerAuthUrl = new URL(loginInitial.headers.location)
    // redirect to the provider with proper params
    assert.equal(providerAuthUrl.host, 'localhost:8998')
    assert.equal(providerAuthUrl.pathname, '/authorize')
    assert.equal(providerAuthUrl.searchParams.get('redirect_uri'), 'http://localhost:5689/simple-directory/api/auth/oauth-callback')
    // successful login on the provider followed by redirect to our callback url
    const loginProvider = await anonymousAx(providerAuthUrl.href, { validateStatus: (status) => status === 302 })
    const providerAuthRedirect = new URL(loginProvider.headers.location)
    assert.equal(providerAuthRedirect.host, 'localhost:5689')
    assert.equal(providerAuthRedirect.pathname, '/simple-directory/api/auth/oauth-callback')
    // open our callback url that produces a temporary token to be transformed in a session token by a token_callback url
    const oauthCallback = await anonymousAx(providerAuthRedirect.href, { validateStatus: (status) => status === 302 })
    const callbackRedirect = new URL(oauthCallback.headers.location)
    assert.equal(callbackRedirect.host, 'localhost:5689')
    assert.equal(callbackRedirect.pathname, '/simple-directory/api/auth/token_callback')
    // finally the token_callback url will set cookies and redirect to our final destination
    const tokenCallback = await anonymousAx(callbackRedirect.href, { validateStatus: (status) => status === 302 })
    assert.equal(tokenCallback.headers['set-cookie']?.length, 3)
    const cookieJar = new CookieJar()
    for (const cookie of tokenCallback.headers['set-cookie']) {
      cookieJar.setCookie(cookie, callbackRedirect.origin)
    }
    const me = (await anonymousAx.get('/api/auth/me', { headers: { Cookie: await cookieJar.getCookieString(callbackRedirect.origin) } })).data
    assert.equal(me.email, 'oidc1@test.com')
  })
})
