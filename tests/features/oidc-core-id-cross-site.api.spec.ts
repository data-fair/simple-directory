import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx, createUser, getServerConfig, mockOidcControlUrl1 } from '../support/axios.ts'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { CookieJar } from 'tough-cookie'

// MOCK_OIDC_PORT1 is a globally-declared non-core-id OIDC provider in development.cjs,
// but we attach its discovery as a *site-level* coreIdProvider on the org's main site
// to exercise the cross-site keepalive path.
const mockOidcPort = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')

test.describe('OIDC core id provider across sibling sites', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await axiosBuilder().patch(mockOidcControlUrl1 + '/_test/userinfo', {
      sub: 'sitecoreid1',
      email: 'sitecoreid1@test.com',
      email_verified: true,
      given_name: 'Site',
      family_name: 'CoreId'
    })
  })
  test.afterEach(async () => {
    await axiosBuilder().delete(mockOidcControlUrl1 + '/_test')
  })

  test('keepalive should succeed on a sibling site after core-id OIDC login on the org main site', async () => {
    const config = await getServerConfig()
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const anonymousAx = await axios()

    // Create an org owned by admin + two sibling sites: main (isAccountMain) and other (onlyOtherSite)
    const org = (await adminAx.post('/api/organizations', { name: 'Cross Site Org' })).data
    const owner = { type: 'organization', id: org.id, name: org.name }
    const mainHost = `127.0.0.1:${process.env.NGINX_PORT2}`
    const otherHost = `127.0.0.1:${process.env.NGINX_PORT3}`
    const mainUrl = `http://${mainHost}/simple-directory`
    const otherUrl = `http://${otherHost}/simple-directory`

    await anonymousAx.post('/api/sites',
      { _id: 'test_cross_main', owner, host: mainHost, theme: { primaryColor: '#000000' } },
      { params: { key: config.secretKeys.sites } })
    await anonymousAx.post('/api/sites',
      { _id: 'test_cross_other', owner, host: otherHost, theme: { primaryColor: '#000000' } },
      { params: { key: config.secretKeys.sites } })

    // Main-org site: onlyLocal + isAccountMain + site-level OIDC coreIdProvider
    await adminAx.patch('/api/sites/test_cross_main', {
      authMode: 'onlyLocal',
      isAccountMain: true,
      authProviders: [{
        type: 'oidc',
        title: 'Site Core Idp',
        discovery: `http://localhost:${mockOidcPort}/.well-known/openid-configuration`,
        client: { id: 'test-client', secret: 'test-secret' },
        coreIdProvider: true,
        createMember: { type: 'always' }
      }]
    })

    // Secondary site: onlyOtherSite pointing back to the main-org site
    await adminAx.patch('/api/sites/test_cross_other', {
      authMode: 'onlyOtherSite',
      authOnlyOtherSite: mainHost
    })
    await testEnvAx.post('/clear-site-cache')

    // --- OIDC login dance initiated on the main-org site ---
    const siteProviderId = 'localhost' + mockOidcPort
    const mainAx = await axios({ baseURL: mainUrl })
    const loginInitial = await mainAx.get(`/api/auth/oidc/${siteProviderId}/login`, { validateStatus: (s: number) => s === 302 })
    const providerAuthUrl = new URL(loginInitial.headers.location)
    assert.equal(providerAuthUrl.host, 'localhost:' + mockOidcPort)
    const loginProvider = await mainAx(providerAuthUrl.href, { validateStatus: (s: number) => s === 302 })
    const providerAuthRedirect = new URL(loginProvider.headers.location)
    assert.equal(providerAuthRedirect.host, mainHost, 'OIDC callback must land on the main-org site')
    assert.equal(providerAuthRedirect.pathname, '/simple-directory/api/auth/oauth-callback')
    const oauthCallback = await mainAx(providerAuthRedirect.href, { validateStatus: (s: number) => s === 302 })
    const callbackRedirect = new URL(oauthCallback.headers.location)
    assert.equal(callbackRedirect.pathname, '/simple-directory/api/auth/token_callback')
    const tokenCallback = await mainAx(callbackRedirect.href, { validateStatus: (s: number) => s === 302 })
    assert.equal(tokenCallback.headers['set-cookie']?.length, 6)

    const mainCookieJar = new CookieJar()
    const mainCookieUrl = mainUrl + '/'
    for (const cookie of tokenCallback.headers['set-cookie']) {
      await mainCookieJar.setCookie(cookie, mainCookieUrl)
    }
    const mainCookies = await mainCookieJar.getCookieString(mainCookieUrl)

    // sanity: we are logged in on the main-org site as the OIDC user, with the idp flag set
    const me = (await mainAx.get('/api/auth/me', { headers: { Cookie: mainCookies } })).data
    assert.equal(me.email, 'sitecoreid1@test.com')
    assert.equal(me.idp, 1, 'session payload should carry the idp marker')

    // --- Cross-site redirect to the sibling secondary site ---
    const siteRedirect = (await mainAx.post<string>('/api/auth/site_redirect',
      { redirect: otherUrl },
      { headers: { Cookie: mainCookies } })).data
    assert.ok(siteRedirect.startsWith(`${otherUrl}/api/auth/token_callback`),
      `expected token_callback redirect to the secondary site, got ${siteRedirect}`)

    const otherAx = await axios({ baseURL: otherUrl })
    const otherTokenCallback = await otherAx.get(siteRedirect, { validateStatus: (s: number) => s === 302 })
    assert.equal(otherTokenCallback.headers['set-cookie']?.length, 6)
    const otherCookieJar = new CookieJar()
    const otherCookieUrl = otherUrl + '/'
    for (const cookie of otherTokenCallback.headers['set-cookie']) {
      await otherCookieJar.setCookie(cookie, otherCookieUrl)
    }
    const otherCookies = await otherCookieJar.getCookieString(otherCookieUrl)

    // --- The actual assertion: keepalive on the secondary site must succeed ---
    const keepalive = await otherAx.post('/api/auth/keepalive', undefined, {
      headers: { Cookie: otherCookies },
      validateStatus: () => true
    })
    assert.equal(keepalive.status, 204,
      `expected 204 from /keepalive on secondary site, got ${keepalive.status}: ${JSON.stringify(keepalive.data)}`)
  })
})
