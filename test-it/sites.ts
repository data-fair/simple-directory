import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, axiosAuth, clean, startApiServer, stopApiServer, createUser } from './utils/index.ts'

process.env.STORAGE_TYPE = 'mongo'

describe('sites api', () => {
  before(startApiServer)
  beforeEach(async () => await clean())
  after(stopApiServer)

  it('should create a site for a standalone portal', async () => {
    const config = (await import('../api/src/config.ts')).default

    const anonymousAx = await axios()
    await assert.rejects(anonymousAx.post('/api/sites', { host: '127.0.0.1:5989' }), { status: 401 })
    await assert.rejects(anonymousAx.post('/api/sites', { host: '127.0.0.1:5989' }, { params: { key: config.secretKeys.sites } }), { status: 400 })

    const { ax } = await createUser('test-site@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const orgAx = await axiosAuth({ email: 'test-site@test.com', org: org.id })
    const owner = { type: 'organization', id: org.id, name: org.name }

    await anonymousAx.post('/api/sites',
      { _id: 'test', owner, host: '127.0.0.1:5989', theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })

    await assert.rejects(anonymousAx.get('/api/sites'), { status: 401 })

    // anonymous user can access the public info (host, theme and later auth providers) so that we can display custom login page
    const siteDirectoryUrl = 'http://127.0.0.1:5989/simple-directory'
    const publicSite = (await anonymousAx.get(`${siteDirectoryUrl}/api/sites/_public`)).data
    assert.equal(publicSite.authMode, 'onlyBackOffice')
    assert.ok(publicSite.colors.primary)
    assert.ok(publicSite.logo.startsWith('http://127.0.0.1:5989/'))
    const webfonts = (await anonymousAx.get<string>(`${siteDirectoryUrl}/api/sites/_webfonts.css`)).data
    assert.ok(webfonts.startsWith('@font-face'))

    let sites = (await ax.get('/api/sites')).data
    assert.equal(sites.count, 0)

    sites = (await orgAx.get('/api/sites')).data
    assert.equal(sites.count, 1)

    // a user created directly on the second site
    const { ax: siteAx1 } = await createUser('test-site2@test.com', false, 'TestPasswd01', siteDirectoryUrl)
    await siteAx1.get('/api/auth/me')

    // the first user can connect on secondary site from the main one
    const siteRedirect = (await ax.post<string>('/api/auth/site_redirect', { redirect: siteDirectoryUrl })).data
    assert.ok(siteRedirect.startsWith(`${siteDirectoryUrl}/api/auth/token_callback`))
    const siteAx2 = await axios()
    try {
      await siteAx2.get(siteRedirect)
    } catch (err) {
      if (err.status !== 302) throw err
      const redirectUrl = new URL(err.headers.location)
      const redirectError = redirectUrl.searchParams.get('error')
      if (redirectError) throw new Error(redirectError)
      assert.equal(err.headers['set-cookie']?.length, 3)
    }
  })
})
