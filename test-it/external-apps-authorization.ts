import { strict as assert } from 'node:assert'

process.env.STORAGE_TYPE = 'mongo'

import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, clean, startApiServer, stopApiServer, createUser } from './utils/index.ts'

describe('External Apps Authorization Flow', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('should implement Authorization flow for external apps', async () => {
    const config = (await import('../api/src/config.ts')).default

    // 1. Create a site with application configuration
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const org = (await adminAx.post('/api/organizations', { name: 'Site Org' })).data

    // Determine port
    const port = new URL(adminAx.defaults.baseURL || '').port
    const siteHost = `127.0.0.1:${port}`

    const anonymousAx = await axios()
    await anonymousAx.post('/api/sites',
      {
        _id: 'test-site',
        owner: { type: 'organization', id: org.id, name: org.name },
        host: siteHost,
        theme: { primaryColor: '#000000' },
        applications: [{
          id: 'native-app-client',
          name: 'Native App',
          redirectUris: ['native-app://auth-callback']
        }]
      },
      { params: { key: config.secretKeys.sites } }
    )

    // Enable local auth to allow user creation
    await adminAx.patch('/api/sites/test-site', { authMode: 'onlyLocal' });
    (await import('../api/src/sites/service.ts')).getSiteByHost.clear()

    // 2. Create a user on the site
    const { ax: userSiteAx } = await createUser('native-test@test.com', false, 'TestPasswd01', `http://${siteHost}/simple-directory`)

    // 3. Call GET /authorize endpoint - should redirect to login UI
    const authorizeGetUrl = '/api/auth/apps/authorize?client_id=native-app-client&redirect_uri=native-app://auth-callback'

    const authorizeGetRes = await userSiteAx.get(authorizeGetUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    })
    console.log('GET Redirect location:', authorizeGetRes.headers.location)

    // Verify redirect to login UI with authorizeApp step
    const loginRedirectUrl = new URL(authorizeGetRes.headers.location)
    assert.equal(loginRedirectUrl.pathname, '/simple-directory/login')
    assert.equal(loginRedirectUrl.searchParams.get('step'), 'authorizeApp')
    assert.equal(loginRedirectUrl.searchParams.get('client_id'), 'native-app-client')
    assert.equal(loginRedirectUrl.searchParams.get('client_name'), 'Native App')
    assert.equal(loginRedirectUrl.searchParams.get('redirect_uri'), 'native-app://auth-callback')

    // 4. Call POST /authorize to confirm authorization (simulating user clicking "Authorize")
    const authorizePostRes = await userSiteAx.post('/api/auth/apps/authorize', {
      client_id: 'native-app-client',
      redirect_uri: 'native-app://auth-callback'
    })

    assert.equal(authorizePostRes.status, 200)
    assert.ok(authorizePostRes.data.redirectUrl, 'Should return redirect URL')

    // 5. Verify redirect URL contains code
    const redirectUrl = new URL(authorizePostRes.data.redirectUrl)
    assert.equal(redirectUrl.protocol, 'native-app:')
    assert.equal(redirectUrl.host, 'auth-callback')

    const code = redirectUrl.searchParams.get('code')
    assert.ok(code, 'Authorization code should be present')

    // 6. Exchange code for session (simulating native app request)
    const appAx = await axios({ baseURL: `http://${siteHost}/simple-directory` })

    const loginRes2 = await appAx.post('/api/auth/apps/login', {
      code
    })

    assert.equal(loginRes2.status, 200)
    // Check if user is returned
    assert.equal(loginRes2.data.email, 'native-test@test.com')

    // Check if cookies are set
    const appCookies = loginRes2.headers['set-cookie']
    assert.ok(appCookies, 'Session cookies should be set')
    assert.ok(appCookies.some(c => c.startsWith('id_token')), 'id_token should be present')

    // 7. Verify session works
    const appSessionAx = await axios({
      baseURL: `http://${siteHost}/simple-directory`,
      headers: { Cookie: appCookies }
    })
    const meRes = await appSessionAx.get('/api/auth/me')
    assert.equal(meRes.status, 200)
    assert.equal(meRes.data.email, 'native-test@test.com')

    // 8. Replay Check: Code reuse (stateless JWT)
    // Since it's stateless, it CAN be reused within validity period.
    const replayRes = await appAx.post('/api/auth/apps/login', {
      code
    })
    assert.equal(replayRes.status, 200)
  })

  it('should reject POST authorize without authentication', async () => {
    const config = (await import('../api/src/config.ts')).default
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const org = (await adminAx.post('/api/organizations', { name: 'Site Org Auth' })).data
    const port = new URL(adminAx.defaults.baseURL || '').port
    const siteHost = `127.0.0.1:${port}`

    const anonymousAx = await axios()
    await anonymousAx.post('/api/sites',
      {
        _id: 'test-site-auth',
        owner: { type: 'organization', id: org.id, name: org.name },
        host: siteHost,
        theme: { primaryColor: '#000000' },
        applications: [{
          id: 'native-app-client',
          name: 'Native App',
          redirectUris: ['native-app://auth-callback']
        }]
      },
      { params: { key: config.secretKeys.sites } }
    )

    const siteAx = await axios({ baseURL: `http://${siteHost}/simple-directory` })

    // POST without authentication should fail
    const authorizeRes = await siteAx.post('/api/auth/apps/authorize', {
      client_id: 'native-app-client',
      redirect_uri: 'native-app://auth-callback'
    }, {
      validateStatus: (status) => status === 401
    })

    assert.match(authorizeRes.data, /Not authenticated/)
  })

  it('should reject invalid client_id', async () => {
    const config = (await import('../api/src/config.ts')).default
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const org = (await adminAx.post('/api/organizations', { name: 'Site Org 2' })).data
    const port = new URL(adminAx.defaults.baseURL || '').port
    const siteHost = `127.0.0.1:${port}`

    const anonymousAx = await axios()
    await anonymousAx.post('/api/sites',
      {
        _id: 'test-site-2',
        owner: { type: 'organization', id: org.id, name: org.name },
        host: siteHost,
        theme: { primaryColor: '#000000' },
        applications: []
      },
      { params: { key: config.secretKeys.sites } }
    )

    const siteAx = await axios({ baseURL: `http://${siteHost}/simple-directory` })

    const authorizeUrl = '/api/auth/apps/authorize?client_id=invalid-client&redirect_uri=native-app://auth-callback'

    const authorizeRes = await siteAx.get(authorizeUrl, {
      maxRedirects: 0,
      validateStatus: (status) => status === 400
    })

    assert.match(authorizeRes.data, /Unknown client_id/)
  })
})
