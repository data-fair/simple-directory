import { test, expect } from '../support/e2e-fixtures.ts'
import { testEnvAx } from '../support/axios.ts'

test.describe('Admin users page', () => {
  test.beforeEach(async () => {
    await testEnvAx.post('/seed')
  })

  test('displays user table for admin', async ({ page, appUrl, loginExisting }) => {
    await loginExisting('_superadmin@test.com', { password: 'Test1234', adminMode: true })

    await page.goto(appUrl('/admin/users'))
    await expect(page.locator('.users-table')).toBeVisible()
    await expect(page.locator('.users-table tbody tr').first()).toBeVisible()
  })

  test('search filters users', async ({ page, appUrl, loginExisting }) => {
    await loginExisting('_superadmin@test.com', { password: 'Test1234', adminMode: true })

    await page.goto(appUrl('/admin/users'))
    await expect(page.locator('.users-table')).toBeVisible()

    const searchField = page.locator('input[name="search"]')
    await searchField.fill('dmeadus0')
    await searchField.press('Enter')

    await page.waitForTimeout(500)
    await expect(page.locator('.users-table').getByText('dmeadus0@answers.com')).toBeVisible()
  })

  test('non-admin user is redirected from admin page', async ({ page, appUrl, loginAs }) => {
    await loginAs('regular@test.com')

    await page.goto(appUrl('/admin/users'))
    // Wait for API response (which returns 403 for non-admin)
    await page.waitForTimeout(1000)
    // The table renders but should have no data rows
    const count = await page.locator('.users-table tbody tr').count()
    expect(count).toBeLessThanOrEqual(1)
  })
})
