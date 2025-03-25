import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, clean, startApiServer, stopApiServer, createUser } from './utils/index.ts'
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
  },
  createMember: {
    type: 'always'
  },
  memberRole: {
    type: 'attribute',
    attribute: 'role',
  }
}, {
  title: 'Test provider core',
  coreIdProvider: true,
  discovery: 'http://localhost:8999/.well-known/openid-configuration',
  client: {
    id: 'test-client',
    secret: 'test-secret'
  },
  createMember: {
    type: 'always'
  },
  memberRole: {
    type: 'attribute',
    attribute: 'role',
  }
}])
process.env.DEFAULT_ORG = 'org1'

const oidcUserInfo1 = { sub: 'testoidc1', email: 'oidc1@test.com', given_name: 'OIDC', family_name: 'Test', role: 'contrib' }
const oidcUserInfo2 = { sub: 'testoidc2', email: 'oidc2@test.com', given_name: 'OIDC', family_name: 'Test', role: 'contrib' }

const loginWithOIDC = async (port: number) => {
  const anonymousAx = await axios()

  // request a login from the provider
  const loginInitial = await anonymousAx.get(`/api/auth/oauth/localhost${port}/login`, { validateStatus: (status) => status === 302 })
  const providerAuthUrl = new URL(loginInitial.headers.location)
  // redirect to the provider with proper params
  assert.equal(providerAuthUrl.host, 'localhost:' + port)
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
  assert.equal(tokenCallback.headers['set-cookie']?.length, 4)
  const cookieJar = new CookieJar()
  for (const cookie of tokenCallback.headers['set-cookie']) {
    cookieJar.setCookie(cookie, callbackRedirect.origin)
  }

  anonymousAx.defaults.headers.Cookie = await cookieJar.getCookieString(callbackRedirect.origin)

  return anonymousAx
}

const startOAuthServer = async (port: number, oidcUserInfo: any) => {
  const oauthServer = new OAuth2Server()
  await oauthServer.issuer.keys.generate('RS256')
  oauthServer.service.on('beforeUserinfo', (userInfoResponse, req) => {
    userInfoResponse.body = { ...oidcUserInfo }
  })
  await oauthServer.start(port, 'localhost')
  return oauthServer
}

describe('global OIDC configuration', () => {
  let oauthServer1: OAuth2Server
  let oauthServer2: OAuth2Server
  before(async () => {
    oauthServer1 = await startOAuthServer(8998, oidcUserInfo1)
    oauthServer2 = await startOAuthServer(8999, oidcUserInfo2)
  })
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)
  after(async () => {
    await oauthServer1.stop()
    await oauthServer2.stop()
  })

  it('should implement a standard login workflow', async () => {
    const { ax } = await createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test', id: 'org1', roles: ['admin', 'user', 'contrib'] })

    const anonymousAx = await axios()
    const providers = (await anonymousAx.get('/api/auth/providers')).data
    assert.ok(providers.find(p => p.id === 'github'))
    assert.ok(providers.find(p => p.id === 'localhost8998'))

    const ax1 = await loginWithOIDC(8998)
    const me = (await ax1.get('/api/auth/me')).data
    assert.equal(me.email, 'oidc1@test.com')
    assert.equal(me.name, 'OIDC Test')
    assert.equal(me.readOnly, undefined)
    assert.deepEqual(me.organizations, [{ id: 'org1', name: 'test', role: 'contrib', dflt: 1 }])

    // by default the info is not synced on next login
    oidcUserInfo1.family_name = 'Test2'
    oidcUserInfo1.role = 'admin'
    const ax2 = await loginWithOIDC(8998)
    const me2 = (await ax2.get('/api/auth/me')).data
    assert.equal(me2.email, 'oidc1@test.com')
    assert.equal(me2.name, 'OIDC Test')
    assert.deepEqual(me2.organizations, [{ id: 'org1', name: 'test', role: 'contrib', dflt: 1 }])
  })

  it('should implement a standard login workflow on a core id provider', async () => {
    const { ax } = await createUser('test-org@test.com')
    await ax.post('/api/organizations', { name: 'test', id: 'org1', roles: ['admin', 'user', 'contrib'] })

    const anonymousAx = await axios()
    const providers = (await anonymousAx.get('/api/auth/providers')).data
    assert.ok(providers.find(p => p.id === 'github'))
    assert.ok(providers.find(p => p.id === 'localhost8998'))

    const ax1 = await loginWithOIDC(8999)
    const me = (await ax1.get('/api/auth/me')).data
    assert.equal(me.email, 'oidc2@test.com')
    assert.equal(me.name, 'OIDC Test')
    assert.deepEqual(me.organizations, [{ id: 'org1', name: 'test', role: 'contrib', dflt: 1, readOnly: true }])

    // the info is synced on next login
    oidcUserInfo2.family_name = 'Test2'
    oidcUserInfo2.role = 'admin'
    const ax2 = await loginWithOIDC(8999)
    const me2 = (await ax2.get('/api/auth/me')).data
    assert.equal(me2.email, 'oidc2@test.com')
    assert.equal(me2.name, 'OIDC Test2')
    assert.deepEqual(me2.organizations, [{ id: 'org1', name: 'test', role: 'admin', dflt: 1, readOnly: true }])
  })
})
