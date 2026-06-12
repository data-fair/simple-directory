import { test, expect } from '../support/e2e-fixtures.ts'
import { testEnvAx } from '../support/axios.ts'

// Verifies the superadmin manual-partnership UI: a superadmin (in adminMode) can
// directly add an existing organization as a partner and delete it, from the org page.
test.describe('Superadmin manual partnerships', () => {
  test.beforeEach(async () => {
    await testEnvAx.post('/seed')
  })

  test('superadmin adds an existing org as a partner and removes it', async ({ page, appUrl, loginExisting }) => {
    await loginExisting('_superadmin@test.com', { password: 'Test1234', adminMode: true })

    // Org A = Fivechat (test_KWqAGZ4mG), partner-to-add = Blogpad (test_ihMQiGTaY)
    await page.goto(appUrl('/organization/test_KWqAGZ4mG'))

    // The partners section is visible to the superadmin (UI is in French: "Organisations partenaires")
    const partnersHeading = page.getByRole('heading', { name: /partenaire/i })
    await expect(partnersHeading).toBeVisible({ timeout: 10_000 })

    // Open the superadmin add-partner dialog (the admin-colored + fab in the partners heading)
    await partnersHeading.locator('button').last().click()

    const dialog = page.locator('.v-overlay--active .v-card')
    await expect(dialog).toBeVisible()

    // Search for the org by name and select it
    await dialog.locator('input[name="partnerOrg"]').fill('Blogpad')
    await page.getByRole('option', { name: /Blogpad/ }).first().click()

    // Confirm
    await dialog.getByRole('button', { name: /valider|ok|confirm/i }).click()

    // Blogpad now appears in the partners list (scope to listitem to avoid the autocomplete option)
    const partnerRow = page.getByRole('listitem').filter({ hasText: 'Blogpad' })
    await expect(partnerRow).toBeVisible({ timeout: 10_000 })

    // Remove it via the per-row delete control, then confirm in the dialog ("Supprimer Blogpad" / "Ok")
    await partnerRow.getByRole('button', { name: /supprimer ce partenaire/i }).click()
    const deleteDialog = page.locator('.v-overlay--active .v-card').filter({ hasText: /Supprimer Blogpad/i })
    await deleteDialog.getByRole('button', { name: 'Ok' }).click()

    await expect(page.getByRole('listitem').filter({ hasText: 'Blogpad' })).toHaveCount(0, { timeout: 10_000 })
  })
})
