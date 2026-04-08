import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, axiosAuth, clean, createUser } from '../support/axios.ts'

test.describe('sites api', () => {
  test.beforeEach(async () => {
    await clean()
  })

  test('should create a site for a standalone portal', async () => {
    const config = (await import('../../api/src/config.ts')).default

    const { ax: adminAx } = await createUser('admin@test.com', true)
    const anonymousAx = await axios()
    await assert.rejects(anonymousAx.post('/api/sites', { host: '127.0.0.1:' + process.env.NGINX_PORT2 }), { status: 401 })
    await assert.rejects(anonymousAx.post('/api/sites', { host: '127.0.0.1:' + process.env.NGINX_PORT2 }, { params: { key: config.secretKeys.sites } }), { status: 400 })

    const { ax } = await createUser('test-site@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test' })).data
    const orgAx = await axiosAuth({ email: 'test-site@test.com', org: org.id })
    const owner = { type: 'organization', id: org.id, name: org.name }

    await anonymousAx.post('/api/sites',
      { _id: 'test', owner, host: '127.0.0.1:' + process.env.NGINX_PORT2, theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })

    await assert.rejects(anonymousAx.get('/api/sites'), { status: 401 })

    // anonymous user can access the public info (host, theme and later auth providers) so that we can display custom login page
    const siteDirectoryUrl = `http://127.0.0.1:${process.env.NGINX_PORT2}/simple-directory`
    const publicSite = (await anonymousAx.get(`${siteDirectoryUrl}/api/sites/_public`)).data
    assert.equal(publicSite.authMode, 'onlyBackOffice')
    assert.ok(publicSite.theme.colors.primary)
    assert.ok(publicSite.theme.logo.startsWith('/simple-directory/api/avatars'))
    const themeCss = (await anonymousAx.get<string>(`${siteDirectoryUrl}/api/sites/_theme.css`)).data
    assert.ok(themeCss.includes('@font-face{font-family:BodyFontFamily'))

    let sites = (await ax.get('/api/sites')).data
    assert.equal(sites.count, 0)

    sites = (await orgAx.get('/api/sites')).data
    assert.equal(sites.count, 1)

    // the first user can connect on secondary site from the main one
    const siteRedirect = (await ax.post<string>('/api/auth/site_redirect', { redirect: siteDirectoryUrl })).data
    assert.ok(siteRedirect.startsWith(`${siteDirectoryUrl}/api/auth/token_callback`))
    const siteAx2 = await axios()
    try {
      await siteAx2.get(siteRedirect)
    } catch (err: any) {
      if (err.status !== 302) throw err
      const redirectUrl = new URL(err.headers.location)
      const redirectError = redirectUrl.searchParams.get('error')
      if (redirectError) throw new Error(redirectError)
      assert.equal(err.headers['set-cookie']?.length, 6)
    }

    // cannot create a user on a site in onlyBackOffice mode
    await assert.rejects(createUser('test-site2@test.com', false, 'TestPasswd01', siteDirectoryUrl), { status: 400 })

    // switch auth mode to ssoBackOffice
    await adminAx.patch('/api/sites/test', { authMode: 'ssoBackOffice' })

    // a user can be created directly on the second site
    const { ax: siteAx1 } = await createUser('test-site2@test.com', false, 'TestPasswd01', siteDirectoryUrl)
    await siteAx1.get('/api/auth/me')

    // switch auth mode to onlyLocal
    await adminAx.patch('/api/sites/test', { authMode: 'onlyLocal' })

    // using site_redirect is no longer possible
    await assert.rejects(ax.post<string>('/api/auth/site_redirect', { redirect: siteDirectoryUrl }), { status: 400 })
  })
})
