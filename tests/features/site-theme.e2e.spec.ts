import { test, expect } from '../support/e2e-fixtures.ts'
import { axios, axiosAuth, getServerConfig, testEnvAx } from '../support/axios.ts'

test.describe('Site theme editing', () => {
  let config: any
  let orgAx: any
  let owner: any

  test.beforeEach(async () => {
    await testEnvAx.post('/seed')

    config = await getServerConfig()
    const anonymAx = await axios()

    const adminAx = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', adminMode: true })
    const org = (await adminAx.post('/api/organizations', { name: 'test_theme-org' })).data
    owner = { type: 'organization', id: org.id, name: org.name }
    orgAx = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', org: org.id })

    // Create site with assisted mode and a custom primary color
    await anonymAx.post('/api/sites', {
      _id: 'test_theme',
      owner,
      host: '127.0.0.1:' + process.env.NGINX_PORT2,
      theme: { primaryColor: '#FF0000' }
    }, { params: { key: config.secretKeys.sites } })
  })

  test('preserves assisted colors when switching to manual mode', async ({ page, appUrl, loginExisting }) => {
    await loginExisting('_superadmin@test.com', { password: 'Test1234', adminMode: true })
    await page.goto(appUrl('/admin/sites/test_theme'))

    await expect(page.getByText('mode de gestion des couleurs simplifié')).toBeVisible({ timeout: 15_000 })

    // Verify the primary color shows #FF0000 in assisted mode
    await expect(page.getByRole('textbox', { name: 'Couleur principale', exact: true })).toHaveValue('#FF0000')

    // Toggle assisted mode OFF
    await page.getByText('mode de gestion des couleurs simplifié').click()
    await expect(page.getByText('Thème par défaut')).toBeVisible({ timeout: 5_000 })

    // Primary color should be preserved in manual mode
    await expect(page.getByRole('textbox', { name: 'Couleur principale', exact: true })).toHaveValue('#FF0000')

    // Save and verify via API
    await page.getByRole('button', { name: /enregistrer|save/i }).click()
    await page.waitForTimeout(1000)

    const siteAfter = (await orgAx.get('/api/sites/test_theme')).data
    expect(siteAfter.theme.assistedMode).toBe(false)
    expect(siteAfter.theme.colors.primary).toBe('#FF0000')
  })

  test('preserves manual colors when switching to assisted mode', async ({ page, appUrl, loginExisting }) => {
    // First switch the site to manual mode with a custom primary color via API
    // Get the current full theme, modify it, and patch back
    const current = (await orgAx.get('/api/sites/test_theme')).data
    const manualTheme = { ...current.theme, assistedMode: false }
    manualTheme.colors = { ...manualTheme.colors, primary: '#00FF00' }
    await orgAx.patch('/api/sites/test_theme', { theme: manualTheme })
    const siteBefore = (await orgAx.get('/api/sites/test_theme')).data
    expect(siteBefore.theme.assistedMode).toBe(false)
    expect(siteBefore.theme.colors.primary).toBe('#00FF00')

    await loginExisting('_superadmin@test.com', { password: 'Test1234', adminMode: true })
    await page.goto(appUrl('/admin/sites/test_theme'))

    await expect(page.getByText('mode de gestion des couleurs simplifié')).toBeVisible({ timeout: 15_000 })

    // Verify the primary color shows #00FF00 in manual mode
    await expect(page.getByRole('textbox', { name: 'Couleur principale', exact: true })).toHaveValue('#00FF00')

    // Toggle assisted mode ON
    await page.getByText('mode de gestion des couleurs simplifié').click()

    // Primary color should be preserved in assisted mode
    await expect(page.getByRole('textbox', { name: 'Couleur principale', exact: true })).toHaveValue('#00FF00')

    // Save and verify via API
    await page.getByRole('button', { name: /enregistrer|save/i }).click()
    await page.waitForTimeout(1000)

    const siteAfter = (await orgAx.get('/api/sites/test_theme')).data
    expect(siteAfter.theme.assistedMode).toBe(true)
    expect(siteAfter.theme.assistedModeColors.primary).toBe('#00FF00')
  })
})
