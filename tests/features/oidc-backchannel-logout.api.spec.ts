import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, loginBindingCookie, testEnvAx, createUser, directoryUrl, getServerConfig, mockOidcControlUrl1, mockOidcControlUrl2 } from '../support/axios.ts'
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

  const loginCoreId = async () => {
    const anonymousAx = await axios()
    const loginInitial = await anonymousAx.get(`/api/auth/oauth/localhost${port2}/login`, { validateStatus: (s: number) => s === 302 })
    const loginProvider = await anonymousAx(loginInitial.headers.location, { validateStatus: (s: number) => s === 302 })
    const oauthCallback = await anonymousAx(loginProvider.headers.location, { headers: { Cookie: loginBindingCookie(loginInitial) }, validateStatus: (s: number) => s === 302 })
    const tokenCallback = await anonymousAx(oauthCallback.headers.location, { validateStatus: (s: number) => s === 302 })
    const cookieJar = new CookieJar()
    for (const cookie of tokenCallback.headers['set-cookie'] ?? []) cookieJar.setCookie(cookie, directoryUrl + '/')
    const keepalive = () => anonymousAx.post('/api/auth/keepalive', undefined, { headers: { Cookie: cookieJar.getCookieStringSync(directoryUrl + '/') }, validateStatus: () => true })
    return { keepalive }
  }

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

  test('the legacy Keycloak shape is still accepted on a non strict provider when the verification fails', async () => {
    const res = await postLogout(forge({ iss: issuer2, typ: 'Logout', sid: 'some-session' }))
    assert.equal(res.status, 204)
  })

  test('a forged token that does not have the legacy shape is refused', async () => {
    const res = await postLogout(forge({ iss: issuer2, typ: 'Logout' }))
    assert.equal(res.status, 400)
  })
})

test.describe('back-channel logout of a strict site provider', () => {
  test.beforeEach(async () => {
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
        title: 'Strict Idp',
        discovery: `${issuer1}/.well-known/openid-configuration`,
        client: { id: 'test-client', secret: 'test-secret' },
        strict: true,
        createMember: { type: 'always' }
      }]
    })
    await testEnvAx.post('/clear-site-cache')
  })

  test('accepts a logout token signed by the provider', async () => {
    const res = await postLogout(await sign(mockOidcControlUrl1, logoutClaims(issuer1, { sid: 'sid1' })), siteUrl)
    assert.equal(res.status, 204)
  })

  test('refuses a token signed by another provider that claims the issuer', async () => {
    const res = await postLogout(await sign(mockOidcControlUrl2, logoutClaims(issuer1)), siteUrl)
    assert.equal(res.status, 400)
    assert.ok(!JSON.stringify(res.data).includes('signature'))
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
})
