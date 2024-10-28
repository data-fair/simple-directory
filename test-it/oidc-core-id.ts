import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, clean, startApiServer, stopApiServer, createUser } from './utils/index.ts'
import { OAuth2Server } from 'oauth2-mock-server'
import { CookieJar } from 'tough-cookie'

process.env.STORAGE_TYPE = 'mongo'
process.env.OIDC_PROVIDERS = JSON.stringify([{
  title: 'Test provider',
  discovery: 'http://localhost:8998/.well-known/openid-configuration',
  client: {
    id: 'test-client',
    secret: 'test-secret'
  },
  coreIdProvider: true
}])

describe('global OIDC configuration in coredIdProvider mode', () => {
  let oauthServer: OAuth2Server
  before(async () => {
    oauthServer = new OAuth2Server()
    await oauthServer.issuer.keys.generate('RS256')
    let i = 0
    oauthServer.service.on('beforeResponse', (tokenEndpointResponse, req) => {
      try {
        if (i === 0) assert.equal(req.body.grant_type, 'authorization_code')
        if (i === 1) assert.equal(req.body.grant_type, 'refresh_token')
      } catch (err) {
        console.error(err)
        tokenEndpointResponse.statusCode = 400
      }
      // short expiration (1s) to test token refresh on keepalive
      tokenEndpointResponse.body.expires_in = 1
      i++
    })
    oauthServer.service.on('beforeUserinfo', (userInfoResponse, req) => {
      userInfoResponse.body = {
        sub: 'testoidc1',
        email: 'oidc1@test.com',
        given_name: 'Test',
        family_name: 'Oidc' + i
      }
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
    const { ax: adminAx } = await createUser('admin@test.com', true)

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
    assert.equal(tokenCallback.headers['set-cookie']?.length, 2)
    const cookieJar = new CookieJar()
    for (const cookie of tokenCallback.headers['set-cookie']) {
      cookieJar.setCookie(cookie, callbackRedirect.origin)
    }
    let me = (await anonymousAx.get('/api/auth/me', { headers: { Cookie: await cookieJar.getCookieString(callbackRedirect.origin) } })).data
    assert.equal(me.email, 'oidc1@test.com')
    assert.equal(me.name, 'Test Oidc1')

    const oauthTokens = (await adminAx.get('/api/oauth-tokens')).data?.results
    assert.equal(oauthTokens?.length, 1)

    await new Promise(resolve => setTimeout(resolve, 1100))
    const keepalive = await anonymousAx.post('/api/auth/keepalive', undefined, { headers: { Cookie: await cookieJar.getCookieString(callbackRedirect.origin) } })
    assert.equal(keepalive.headers['set-cookie']?.length, 2)
    for (const cookie of keepalive.headers['set-cookie']) {
      cookieJar.setCookie(cookie, callbackRedirect.origin)
    }

    const oauthTokens2 = (await adminAx.get('/api/oauth-tokens')).data?.results
    assert.equal(oauthTokens2?.length, 1)
    assert.ok(oauthTokens2[0].token.expires_at > oauthTokens[0].token.expires_at)

    me = (await anonymousAx.get('/api/auth/me', { headers: { Cookie: await cookieJar.getCookieString(callbackRedirect.origin) } })).data
    assert.equal(me.email, 'oidc1@test.com')
    assert.equal(me.name, 'Test Oidc2')
  })
})
