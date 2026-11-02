import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, axiosAuth, loginBindingCookie, testEnvAx, createUser, directoryUrl, getServerConfig, mockOidcControlUrl1, mockOidcControlUrl2 } from '../support/axios.ts'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { CookieJar } from 'tough-cookie'

// OIDC Back-Channel Logout 1.0: the logout token is verified against the keys of the provider
// identified by its iss. Mock 2 is the root (non strict) core id provider, mock 1 serves a strict site provider.
const port1 = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')
const port2 = parseInt(process.env.MOCK_OIDC_PORT2 || '8999')
const issuer1 = `http://localhost:${port1}`
const issuer2 = `http://localhost:${port2}`
const EVENT = 'http://schemas.openid.net/event/backchannel-logout'

const host = `127.0.0.1:${process.env.NGINX_PORT2}`
const siteUrl = `http://${host}/simple-directory`

const sign = async (controlUrl: string, claims: Record<string, any>): Promise<string> =>
  (await axiosBuilder().post(controlUrl + '/_test/sign', claims)).data.token

const logoutClaims = (issuer: string, extra: Record<string, any> = {}) => ({
  iss: issuer,
  aud: 'test-client',
  sub: 'testoidc1',
  jti: 'jti-' + Math.random(),
  iat: Math.floor(Date.now() / 1000),
  events: { [EVENT]: {} },
  ...extra
})

const postLogout = async (token: string, baseURL = directoryUrl) => {
  const ax = await axios({ baseURL })
  return ax.post('/api/auth/oauth-logout', new URLSearchParams({ logout_token: token }).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    validateStatus: () => true
  })
}

// a token with a valid shape but not signed by the provider
const forge = (claims: Record<string, any>, header: Record<string, any> = { alg: 'HS256', typ: 'JWT' }) => {
  const b64 = (o: any) => Buffer.from(JSON.stringify(o)).toString('base64url')
  return `${b64(header)}.${b64(claims)}.${Buffer.from('forged').toString('base64url')}`
}

// logs a user in through a provider and returns the keepalive call of the session (204 while alive, 401 once logged out)
const login = async (baseURL: string, loginPath: string) => {
  const ax = await axios({ baseURL })
  const loginInitial = await ax.get(loginPath, { validateStatus: (s: number) => s === 302 })
  const loginProvider = await ax(loginInitial.headers.location, { validateStatus: (s: number) => s === 302 })
  const oauthCallback = await ax(loginProvider.headers.location, { headers: { Cookie: loginBindingCookie(loginInitial) }, validateStatus: (s: number) => s === 302 })
  const tokenCallback = await ax(oauthCallback.headers.location, { validateStatus: (s: number) => s === 302 })
  const cookieJar = new CookieJar()
  for (const cookie of tokenCallback.headers['set-cookie'] ?? []) cookieJar.setCookie(cookie, baseURL + '/')
  const keepalive = () => ax.post('/api/auth/keepalive', undefined, { headers: { Cookie: cookieJar.getCookieStringSync(baseURL + '/') }, validateStatus: () => true })
  return { keepalive }
}

const setUserinfo = (controlUrl: string, sub: string, email: string) =>
  axiosBuilder().patch(controlUrl + '/_test/userinfo', { sub, email, email_verified: true, given_name: 'Test', family_name: 'Oidc' })

test.describe('back-channel logout of a core id provider (root, non strict)', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/userinfo', {
      sub: 'testoidc1', email: 'oidc1@test.com', email_verified: true, given_name: 'Test', family_name: 'Oidc1'
    })
  })
  test.afterEach(async () => {
    await axiosBuilder().delete(mockOidcControlUrl2 + '/_test')
  })

  const loginCoreId = () => login(directoryUrl, `/api/auth/oauth/localhost${port2}/login`)

  test('a logout token signed by the provider logs the user out', async () => {
    const { keepalive } = await loginCoreId()
    const res = await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer2)))
    assert.equal(res.status, 204)
    assert.equal((await keepalive()).status, 401)
  })

  test('a logout token for another subject leaves the session alone', async () => {
    const { keepalive } = await loginCoreId()
    const res = await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer2, { sub: 'someoneelse' })))
    assert.equal(res.status, 204)
    assert.equal((await keepalive()).status, 204)
  })

  test('a forged unsigned logout token does not log the user out', async () => {
    const { keepalive } = await loginCoreId()
    const res = await postLogout(forge(logoutClaims(issuer2)))
    assert.equal(res.status, 400)
    assert.equal((await keepalive()).status, 204)
  })

  test('a logout token with an unknown issuer is refused', async () => {
    const res = await postLogout(await sign(mockOidcControlUrl2, logoutClaims('http://unknown.example.com')))
    assert.equal(res.status, 400)
  })

  test('a missing logout token is refused', async () => {
    const res = await postLogout('')
    assert.equal(res.status, 400)
  })

  test('a logout token matches the session by sid, without sub', async () => {
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/id-token-claims', { sid: 'sid-abc' })
    const { keepalive } = await loginCoreId()
    const other = await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer2, { sub: null, sid: 'sid-other' })))
    assert.equal(other.status, 204)
    assert.equal((await keepalive()).status, 204)
    const res = await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer2, { sub: null, sid: 'sid-abc' })))
    assert.equal(res.status, 204)
    assert.equal((await keepalive()).status, 401)
  })

  test('the legacy Keycloak shape is still accepted on a non strict provider when the verification fails', async () => {
    await axiosBuilder().patch(mockOidcControlUrl2 + '/_test/id-token-claims', { sid: 'sid-legacy' })
    const { keepalive } = await loginCoreId()
    const res = await postLogout(forge({ iss: issuer2, typ: 'Logout', sid: 'sid-legacy' }))
    assert.equal(res.status, 204)
    assert.equal((await keepalive()).status, 401)
  })

  test('a logout token without iat or issued more than 10 minutes ago is refused', async () => {
    const now = Math.floor(Date.now() / 1000)
    // the root provider is not strict: the refusal shows as a 400 only because the token has no legacy shape either
    assert.equal((await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer2, { iat: null })))).status, 400)
    assert.equal((await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer2, { iat: now - 660 })))).status, 400)
    assert.equal((await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer2, { iat: now - 540 })))).status, 204)
  })

  test('a forged token that does not have the legacy shape is refused', async () => {
    const res = await postLogout(forge({ iss: issuer2, typ: 'Logout' }))
    assert.equal(res.status, 400)
  })
})

const setupSiteProvider = async (discoveryIssuer: string, strict = true) => {
  await testEnvAx.delete('/')
  const config = await getServerConfig()
  const adminAx = (await createUser('admin@test.com', true)).ax
  const org = (await adminAx.post('/api/organizations', { name: 'Logout Org' })).data
  const owner = { type: 'organization', id: org.id, name: org.name }
  await (await axios()).post('/api/sites',
    { _id: 'test_logout_site', owner, host, theme: { primaryColor: '#000000' } },
    { params: { key: config.secretKeys.sites } })
  await adminAx.patch('/api/sites/test_logout_site', {
    authMode: 'onlyLocal',
    authProviders: [{
      type: 'oidc',
      title: 'Site Idp',
      discovery: `${discoveryIssuer}/.well-known/openid-configuration`,
      client: { id: 'test-client', secret: 'test-secret' },
      strict,
      coreIdProvider: true,
      createMember: { type: 'always' }
    }]
  })
  await testEnvAx.post('/clear-site-cache')
}

test.describe('back-channel logout of a strict site provider', () => {
  test.beforeEach(async () => {
    await setUserinfo(mockOidcControlUrl1, 'testoidc1', 'oidc1@test.com')
    await setupSiteProvider(issuer1)
  })
  test.afterEach(async () => {
    await axiosBuilder().delete(mockOidcControlUrl1 + '/_test')
  })

  test('logs out a session when the token is signed by the provider', async () => {
    const { keepalive } = await login(siteUrl, `/api/auth/oidc/localhost${port1}/login`)
    assert.equal((await keepalive()).status, 204)
    const res = await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1)), siteUrl)
    assert.equal(res.status, 204)
    assert.equal((await keepalive()).status, 401)
  })

  test('refuses a token signed by another provider that claims the issuer', async () => {
    const { keepalive } = await login(siteUrl, `/api/auth/oidc/localhost${port1}/login`)
    const res = await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer1)), siteUrl)
    assert.equal(res.status, 400)
    assert.ok(!JSON.stringify(res.data).includes('signature'))
    assert.equal((await keepalive()).status, 204)
  })

  test('refuses a forged unsigned token, even with the legacy shape', async () => {
    const res = await postLogout(forge({ iss: issuer1, typ: 'Logout', sid: 'some-session' }), siteUrl)
    assert.equal(res.status, 400)
  })

  test('refuses a token without the back-channel logout event', async () => {
    const res = await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1, { events: null })), siteUrl)
    assert.equal(res.status, 400)
  })

  test('refuses a token with a nonce', async () => {
    const res = await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1, { nonce: 'abc' })), siteUrl)
    assert.equal(res.status, 400)
  })

  test('refuses a token with neither sid nor sub', async () => {
    const res = await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1, { sub: null })), siteUrl)
    assert.equal(res.status, 400)
  })

  test('refuses a token for another audience', async () => {
    const res = await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1, { aud: 'other' })), siteUrl)
    assert.equal(res.status, 400)
  })

  test('refuses a token without iat or issued too long ago, accepts a recent one', async () => {
    const now = Math.floor(Date.now() / 1000)
    assert.equal((await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1, { iat: null })), siteUrl)).status, 400)
    assert.equal((await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1, { iat: now - 660 })), siteUrl)).status, 400)
    assert.equal((await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1, { iat: now - 540 })), siteUrl)).status, 204)
  })

  test('is not failed by another broken provider of the site', async () => {
    const adminAx = (await axiosAuth({ email: 'admin@test.com', adminMode: true, password: 'TestPasswd01', axiosOpts: { baseURL: directoryUrl }, directoryUrl })) as any
    await adminAx.patch('/api/sites/test_logout_site', {
      authProviders: [{
        type: 'oidc',
        title: 'Broken Idp',
        discovery: 'http://127.0.0.1:1/.well-known/openid-configuration',
        client: { id: 'x', secret: 'y' },
        strict: true,
        createMember: { type: 'always' }
      }, {
        type: 'oidc',
        title: 'Site Idp',
        discovery: `${issuer1}/.well-known/openid-configuration`,
        client: { id: 'test-client', secret: 'test-secret' },
        strict: true,
        coreIdProvider: true,
        createMember: { type: 'always' }
      }]
    })
    await testEnvAx.post('/clear-site-cache')
    const res = await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1)), siteUrl)
    assert.equal(res.status, 204)
  })
})

// provider ids are the host of the discovery url: a root provider and a site provider on the same idp share one
test.describe('back-channel logout is scoped to the level of the provider', () => {
  test.beforeEach(async () => {
    await setUserinfo(mockOidcControlUrl2, 'testoidc1', 'oidc-root@test.com')
    await setupSiteProvider(issuer2)
  })
  test.afterEach(async () => {
    await axiosBuilder().delete(mockOidcControlUrl2 + '/_test')
  })

  test('a token for the site provider does not log out a root session with the same provider id and sub', async () => {
    const root = await login(directoryUrl, `/api/auth/oauth/localhost${port2}/login`)
    await setUserinfo(mockOidcControlUrl2, 'testoidc1', 'oidc-site@test.com')
    const siteSession = await login(siteUrl, `/api/auth/oidc/localhost${port2}/login`)
    const res = await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer2)), siteUrl)
    assert.equal(res.status, 204)
    assert.equal((await siteSession.keepalive()).status, 401)
    assert.equal((await root.keepalive()).status, 204)
  })

  test('a token for the root provider does not log out a site session with the same provider id and sub', async () => {
    const root = await login(directoryUrl, `/api/auth/oauth/localhost${port2}/login`)
    await setUserinfo(mockOidcControlUrl2, 'testoidc1', 'oidc-site@test.com')
    const siteSession = await login(siteUrl, `/api/auth/oidc/localhost${port2}/login`)
    const res = await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer2)))
    assert.equal(res.status, 204)
    assert.equal((await root.keepalive()).status, 401)
    assert.equal((await siteSession.keepalive()).status, 204)
  })
})
