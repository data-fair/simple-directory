import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, loginBindingCookie, testEnvAx, createUser, getServerConfig, mockOidcControlUrl1 } from '../support/axios.ts'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'

// id_token validation under the per-provider policy: a strict provider refuses an invalid token,
// a non strict one carries on (and raises an alert, covered by oidc-policy.unit.spec.ts)
const mockOidcPort = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')
const host = `127.0.0.1:${process.env.NGINX_PORT2}`
const siteUrl = `http://${host}/simple-directory`
const providerId = 'localhost' + mockOidcPort
const userinfo = { sub: 'teststrict1', email: 'strict1@test.com', email_verified: true, given_name: 'Strict', family_name: 'Test' }

let adminAx: any
const patchProvider = async (strict: boolean, userInfoSource?: string) => {
  await adminAx.patch('/api/sites/test_strict_site', {
    authMode: 'onlyLocal',
    authProviders: [{
      type: 'oidc',
      title: 'Strict Idp',
      discovery: `http://localhost:${mockOidcPort}/.well-known/openid-configuration`,
      client: { id: 'test-client', secret: 'test-secret' },
      strict,
      ...(userInfoSource ? { userInfoSource } : {}),
      createMember: { type: 'always' }
    }]
  })
  await testEnvAx.post('/clear-site-cache')
}

const setupSite = async (strict: boolean) => {
  const config = await getServerConfig()
  adminAx = (await createUser('admin@test.com', true)).ax
  const org = (await adminAx.post('/api/organizations', { name: 'Strict Org' })).data
  const owner = { type: 'organization', id: org.id, name: org.name }
  await (await axios()).post('/api/sites',
    { _id: 'test_strict_site', owner, host, theme: { primaryColor: '#000000' } },
    { params: { key: config.secretKeys.sites } })
  await patchProvider(strict)
}

// returns the redirect location of the oauth callback: token_callback on success, login?error= on refusal
const login = async (query?: Record<string, string>) => {
  const siteAx = await axios({ baseURL: siteUrl })
  const loginInitial = await siteAx.get(`/api/auth/oidc/${providerId}/login`, { validateStatus: (s: number) => s === 302 })
  const providerAuthUrl = new URL(loginInitial.headers.location)
  for (const [k, v] of Object.entries(query ?? {})) providerAuthUrl.searchParams.set(k, v)
  const loginProvider = await siteAx(providerAuthUrl.href, { validateStatus: (s: number) => s === 302 })
  const oauthCallback = await siteAx(loginProvider.headers.location, { headers: { Cookie: loginBindingCookie(loginInitial) }, validateStatus: (s: number) => s === 302 })
  return new URL(oauthCallback.headers.location)
}

const patchIdToken = (claims: Record<string, any>) => axiosBuilder().patch(mockOidcControlUrl1 + '/_test/id-token-claims', claims)
const patchRedirect = (params: Record<string, string>) => axiosBuilder().patch(mockOidcControlUrl1 + '/_test/authorize-redirect', params)

const invalidTokens: Record<string, Record<string, any>> = {
  aud: { aud: 'other' },
  iss: { iss: 'http://other' },
  exp: { exp: 1000 },
  sub: { sub: 'someone-else' } // differs from the sub of the userinfo
}

for (const strict of [true, false]) {
  test.describe(`site OIDC provider, strict=${strict}`, () => {
    test.beforeEach(async () => {
      await testEnvAx.delete('/')
      await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/userinfo', userinfo)
      await setupSite(strict)
    })
    test.afterEach(async () => {
      await axiosBuilder().delete(mockOidcControlUrl1 + '/_test')
    })

    test('should accept a valid id_token', async () => {
      const location = await login()
      assert.equal(location.pathname, '/simple-directory/api/auth/token_callback')
    })

    for (const [check, claims] of Object.entries(invalidTokens)) {
      test(`should ${strict ? 'refuse' : 'let through'} an id_token with a bad ${check}`, async () => {
        await patchIdToken(claims)
        const location = await login()
        if (strict) {
          assert.equal(location.pathname, '/simple-directory/login')
          assert.equal(location.searchParams.get('error'), 'badIDPResponse')
        } else {
          assert.equal(location.pathname, '/simple-directory/api/auth/token_callback')
        }
      })
    }

    test(`should ${strict ? 'refuse' : 'let through'} an id_token with a nonce that does not match the relay state`, async () => {
      const location = await login({ nonce: 'tampered' })
      if (strict) assert.equal(location.searchParams.get('error'), 'badIDPResponse')
      else assert.equal(location.pathname, '/simple-directory/api/auth/token_callback')
    })

    test(`should ${strict ? 'refuse' : 'let through'} a token response without id_token`, async () => {
      await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/token-config', { omitIdToken: true })
      const location = await login()
      if (strict) assert.equal(location.searchParams.get('error'), 'badIDPResponse')
      else assert.equal(location.pathname, '/simple-directory/api/auth/token_callback')
    })

    test(`should ${strict ? 'refuse' : 'let through'} claims read from an access token of another subject`, async () => {
      // the mock access token has the sub johndoe, the id_token the one of the userinfo
      await patchProvider(strict, 'access_token')
      await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/access-token-claims', { email: 'strict1@test.com', email_verified: true })
      const location = await login()
      if (strict) assert.equal(location.searchParams.get('error'), 'badIDPResponse')
      else assert.equal(location.pathname, '/simple-directory/api/auth/token_callback')
    })

    test(`should ${strict ? 'refuse' : 'let through'} an authorization response with a bad iss parameter`, async () => {
      await patchRedirect({ iss: 'http://evil' })
      const location = await login()
      if (strict) {
        assert.equal(location.pathname, '/simple-directory/login')
        assert.equal(location.searchParams.get('error'), 'badIDPResponse')
      } else {
        assert.equal(location.pathname, '/simple-directory/api/auth/token_callback')
      }
    })
  })
}
