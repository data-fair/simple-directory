import { test, expect } from '../support/e2e-fixtures.ts'
import { axios, createUser, getServerConfig, testEnvAx } from '../support/axios.ts'

// Verifies the admin-users transfer UI: a superadmin (in adminMode) can move a user
// to a secondary site and back to the main site from the host column of /admin/users.
test.describe('Superadmin user transfer', () => {
  const host2 = '127.0.0.1:' + process.env.NGINX_PORT2

  test('superadmin transfers a user to a secondary site and back', async ({ page, appUrl, loginExisting }) => {
    // setup via API: a superadmin, a plain user and a secondary site at host2
    const { ax: adminAx } = await createUser('admin@test.com', true)
    await createUser('transfer-e2e@test.com')

    const config = await getServerConfig()
    const anonymousAx = await axios()
    const org = (await adminAx.post('/api/organizations', { name: 'transfer-e2e-org' })).data
    await anonymousAx.post('/api/sites',
      { _id: 'test_transfer_e2e', owner: { type: 'organization', id: org.id, name: org.name }, host: host2, theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })
    await testEnvAx.post('/clear-site-cache')

    await loginExisting('admin@test.com', { adminMode: true })
    await page.goto(appUrl('/admin/users'))

    const row = page.locator('tr').filter({ hasText: 'transfer-e2e@test.com' })
    await expect(row).toBeVisible({ timeout: 10_000 })

    // open the transfer dialog from the host column (UI is in French)
    await row.getByRole('button', { name: /transférer vers un autre site/i }).click()
    const dialog = page.locator('.v-overlay--active .v-card')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(/transférer l'utilisateur/i)

    // the confirm button is disabled until a target site is selected
    await expect(dialog.getByRole('button', { name: 'Ok' })).toBeDisabled()

    // pick the secondary site and confirm
    await dialog.locator('.v-select').click()
    await page.getByRole('option', { name: host2 }).click()
    await dialog.getByRole('button', { name: 'Ok' }).click()

    // the host column of the user now shows the secondary site
    await expect(row).toContainText(host2, { timeout: 10_000 })

    // transfer back to the main site
    await row.getByRole('button', { name: /transférer vers un autre site/i }).click()
    const dialog2 = page.locator('.v-overlay--active .v-card')
    await dialog2.locator('.v-select').click()
    await page.getByRole('option', { name: 'Site principal' }).click()
    await dialog2.getByRole('button', { name: 'Ok' }).click()

    await expect(row).not.toContainText(host2, { timeout: 10_000 })
  })
})
