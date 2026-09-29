import { test, expect } from '../support/e2e-fixtures.ts'
import { axios, axiosAuth, getServerConfig, testEnvAx } from '../support/axios.ts'

test.describe('main site document admin page', () => {
  let config: any

  test.beforeEach(async () => {
    await testEnvAx.post('/seed')
    config = await getServerConfig()

    const adminAx = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', adminMode: true })
    const org = (await adminAx.post('/api/organizations', { name: 'test_main-site-org' })).data
    const anonymAx = await axios()

    // seeded through the sites secret, exactly as portals-manager does
    await anonymAx.post('/api/sites', {
      _id: 'test_main_site',
      owner: { type: 'organization', id: org.id, name: org.name },
      host: new URL(config.publicUrl).host,
      title: 'Portail de test',
      theme: { primaryColor: '#FF00FF' }
    }, { params: { key: config.secretKeys.sites } })

    // tosMessage is not in the POST body schema, only a superadmin can set it,
    // and with the registration category disabled it produces a warning
    await adminAx.patch('/api/sites/test_main_site', { tosMessage: 'CGU du portail' })

    await testEnvAx.patch('/config', { mainSiteFromDb: ['theme', 'title'] })
    await testEnvAx.post('/clear-site-cache')
  })

  test.afterEach(async () => {
    await testEnvAx.patch('/config', { mainSiteFromDb: [] })
    await testEnvAx.post('/clear-site-cache')
  })

  test('explains the split, keeps auth sections, hides isAccountMain', async ({ page, appUrl, loginExisting }) => {
    await loginExisting('_superadmin@test.com', { password: 'Test1234', adminMode: true })
    await page.goto(appUrl('/admin/sites/test_main_site'))

    await expect(page.getByTestId('main-site-banner')).toBeVisible({ timeout: 15_000 })
    // the registration category is disabled but tosMessage is stored
    await expect(page.getByTestId('main-site-warnings')).toContainText('MAIN_SITE_FROM_DB')

    // auth sections stay visible: the form round-trips them, so hiding would
    // conceal the values the warnings refer to. The generous timeout covers a
    // cold vite compile of this route on the first navigation.
    await expect(page.getByText('Gestion des utilisateurs')).toBeVisible({ timeout: 15_000 })

    // isAccountMain is the one control not offered on the main document.
    // Matched by label, not by text: the deprecated authMode field's own label
    // quotes "Site principal du compte" and would match a text locator.
    await expect(page.getByLabel('Site principal du compte', { exact: true })).toHaveCount(0)
    // the sibling field of that section is still there, so the section itself
    // did render and the assertion above is meaningful
    await expect(page.getByLabel('Titre du site', { exact: true })).toBeVisible()

    // and the form still saves
    await expect(page.getByRole('textbox', { name: 'Couleur principale', exact: true })).toHaveValue('#FF00FF')
    await page.getByRole('button', { name: /enregistrer|save/i }).click()
    await page.waitForTimeout(1000)
    const adminAx = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', adminMode: true })
    const after = (await adminAx.get('/api/sites/test_main_site')).data
    expect(after.title).toBe('Portail de test')
  })

  test('marks the main site in the sites list', async ({ page, appUrl, loginExisting }) => {
    await loginExisting('_superadmin@test.com', { password: 'Test1234', adminMode: true })
    await page.goto(appUrl('/admin/sites'))
    await expect(page.getByText('Site principal', { exact: true })).toBeVisible({ timeout: 15_000 })
  })
})
