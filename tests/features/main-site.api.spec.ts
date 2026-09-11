// End-to-end behaviour of the main site document over HTTP.
// The main host is the one in publicUrl; a site document on it drives
// presentation only, and only for the categories in config.mainSiteFromDb.

import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, axiosAuth, testEnvAx, createUser, getServerConfig, maildevAx, deleteAllEmails } from '../support/axios.ts'

const findEmailTo = async (address: string) => {
  await new Promise(resolve => setTimeout(resolve, 50))
  const emails: any[] = (await maildevAx.get('/email')).data
  return emails.find(m => m.envelope?.to?.[0]?.address === address)
}

const setCategories = async (categories: string[]) => {
  await testEnvAx.patch('/config', { mainSiteFromDb: categories })
  await testEnvAx.post('/clear-site-cache')
}

const seedMainSiteDoc = async () => {
  const config = await getServerConfig()
  const mainHost = new URL(config.publicUrl).host
  const { ax } = await createUser('test-main-site@test.com')
  const org = (await ax.post('/api/organizations', { name: 'test_main_site_org' })).data
  const owner = { type: 'organization', id: org.id, name: org.name }
  const anonymousAx = await axios()
  await anonymousAx.post('/api/sites',
    { _id: 'test_main_site', owner, host: mainHost, title: 'Portail de test', theme: { primaryColor: '#FF00FF' } },
    { params: { key: config.secretKeys.sites } })
  const adminAx = (await createUser('admin@test.com', true)).ax
  await adminAx.patch('/api/sites/test_main_site', {
    mails: { from: 'portal@test.com', contact: 'hello@test.com' },
    tosMessage: 'CGU du portail',
    reducedPersonalInfoAtCreation: true
  })
  await testEnvAx.post('/clear-site-cache')
  return { adminAx, owner }
}

test.describe('main site document', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await setCategories([])
  })

  test.afterEach(async () => {
    await setCategories([])
  })

  test('is ignored when no category is enabled', async () => {
    await seedMainSiteDoc()
    const anonymousAx = await axios()
    const publicSite = (await anonymousAx.get('/api/sites/_public')).data
    assert.equal(publicSite.main, true)
    assert.equal(publicSite.title, undefined)
    assert.notEqual(publicSite.theme.colors.primary, '#FF00FF')
  })

  test('drives theme and title when those categories are enabled', async () => {
    await seedMainSiteDoc()
    await setCategories(['theme', 'title'])
    const anonymousAx = await axios()
    const publicSite = (await anonymousAx.get('/api/sites/_public')).data
    assert.equal(publicSite.title, 'Portail de test')
    assert.equal(publicSite.theme.colors.primary, '#FF00FF')
    assert.equal(publicSite.authMode, 'onlyLocal')
    assert.equal(publicSite.authProviders, undefined)
  })

  test('drives registration copy when that category is enabled', async () => {
    await seedMainSiteDoc()
    await setCategories(['registration'])
    const anonymousAx = await axios()
    const publicSite = (await anonymousAx.get('/api/sites/_public')).data
    assert.equal(publicSite.tosMessage, 'CGU du portail')
    assert.equal(publicSite.reducedPersonalInfoAtCreation, true)
  })

  test('the theme css hash matches the css served under it', async () => {
    await seedMainSiteDoc()
    const anonymousAx = await axios()

    // the css does not carry the raw primary colour, it carries the
    // contrast-computed text colours derived from it, so compare the two
    // states rather than searching for a literal
    await setCategories([])
    const envCss = (await anonymousAx.get<string>('/api/sites/_theme.css')).data

    await setCategories(['theme'])
    const hashes = (await anonymousAx.get('/api/sites/_hashes')).data
    const hashedCss = (await anonymousAx.get<string>(`/api/sites/${hashes.themeCss}/_theme.css`)).data
    const plainCss = (await anonymousAx.get<string>('/api/sites/_theme.css')).data

    assert.equal(hashedCss, plainCss)
    assert.notEqual(plainCss, envCss, 'the document theme must change the css served on the main host')
  })

  test('the theme css hash matches the css served under it with no document', async () => {
    const anonymousAx = await axios()
    const hashes = (await anonymousAx.get('/api/sites/_hashes')).data
    const hashedCss = (await anonymousAx.get<string>(`/api/sites/${hashes.themeCss}/_theme.css`)).data
    const plainCss = (await anonymousAx.get<string>('/api/sites/_theme.css')).data
    assert.equal(hashedCss, plainCss)
  })

  test('mails use the document sender only when the mails category is enabled', async () => {
    await seedMainSiteDoc()

    await setCategories([])
    await deleteAllEmails()
    await createUser('test-mail-env@test.com')
    const envMail = await findEmailTo('test-mail-env@test.com')
    assert.ok(envMail, 'no mail captured for the env case')
    assert.equal(envMail.envelope.from.address, 'no-reply@test.com')

    await setCategories(['mails'])
    await deleteAllEmails()
    await createUser('test-mail-db@test.com')
    const dbMail = await findEmailTo('test-mail-db@test.com')
    assert.ok(dbMail, 'no mail captured for the db case')
    assert.equal(dbMail.envelope.from.address, 'portal@test.com')
  })

  test('reports fields that are never honoured on the main host', async () => {
    const { adminAx } = await seedMainSiteDoc()
    await adminAx.patch('/api/sites/test_main_site', { authMode: 'ssoBackOffice' })
    await setCategories(['theme', 'title', 'mails', 'registration'])
    const site = (await adminAx.get('/api/sites/test_main_site')).data
    assert.ok(Array.isArray(site.mainSiteWarnings))
    assert.ok(site.mainSiteWarnings.some((w: string) => w.includes('authMode')), site.mainSiteWarnings.join(' | '))
  })

  test('reports stored values whose category is disabled', async () => {
    const { adminAx } = await seedMainSiteDoc()
    await setCategories(['title'])
    const site = (await adminAx.get('/api/sites/test_main_site')).data
    const joined = site.mainSiteWarnings.join(' | ')
    assert.ok(joined.includes('MAIN_SITE_FROM_DB'), joined)
    assert.ok(!site.mainSiteWarnings.some((w: string) => w.includes('MAIN_SITE_FROM_DB') && w.includes('title')), joined)
  })

  test('an ordinary site has no main-site warnings', async () => {
    const serverConfig = await getServerConfig()
    const { ax } = await createUser('test-other-site@test.com')
    const org = (await ax.post('/api/organizations', { name: 'test_other_org' })).data
    const anonymousAx = await axios()
    await anonymousAx.post('/api/sites',
      { _id: 'test_other_site', owner: { type: 'organization', id: org.id, name: org.name }, host: '127.0.0.1:' + process.env.NGINX_PORT2 },
      { params: { key: serverConfig.secretKeys.sites } })
    const adminAx = (await createUser('admin@test.com', true)).ax
    const site = (await adminAx.get('/api/sites/test_other_site')).data
    assert.deepEqual(site.mainSiteWarnings, [])
  })

  test('a full-document round-trip patch succeeds and does not toggle other sites', async () => {
    const serverConfig = await getServerConfig()
    const { adminAx, owner } = await seedMainSiteDoc()
    const anonymousAx = await axios()
    await anonymousAx.post('/api/sites',
      { _id: 'test_sibling_site', owner, host: '127.0.0.1:' + process.env.NGINX_PORT2 },
      { params: { key: serverConfig.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_sibling_site', { authMode: 'onlyLocal' })

    // exactly what ui/src/pages/admin/sites/[id].vue sends: the fetched
    // document minus _id / colorWarnings / owner / host / path
    const fetched = (await adminAx.get('/api/sites/test_main_site')).data
    const roundTrip = { ...fetched, isAccountMain: true }
    delete roundTrip._id
    delete roundTrip.colorWarnings
    delete roundTrip.mainSiteWarnings
    delete roundTrip.owner
    delete roundTrip.host
    delete roundTrip.path
    delete roundTrip.updatedAt
    // the theme is in assisted mode, so fillTheme recomputes colors from
    // assistedModeColors on save — editing colors.primary directly would be
    // overwritten
    assert.equal(roundTrip.theme.assistedMode, true)
    roundTrip.theme.assistedModeColors.primary = '#00FF00'

    await adminAx.patch('/api/sites/test_main_site', roundTrip)

    const sibling = (await adminAx.get('/api/sites/test_sibling_site')).data
    assert.equal(sibling.authMode, 'onlyLocal', 'toggleMainSite must not have rewritten the sibling site')
    const patched = (await adminAx.get('/api/sites/test_main_site')).data
    assert.equal(patched.theme.colors.primary, '#00FF00')
  })

  test('a session on the main host is still a back-office session', async () => {
    await seedMainSiteDoc()
    await setCategories(['theme', 'title', 'mails', 'registration'])
    // adminMode requires reqSite() === undefined on the main host; the
    // document must not have changed that
    const adminAx = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    const me = (await adminAx.get('/api/auth/me')).data
    assert.ok(me.adminMode)
    assert.equal(me.host, undefined)
  })
})
