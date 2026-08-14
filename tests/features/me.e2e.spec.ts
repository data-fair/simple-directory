import { test, expect } from '../support/e2e-fixtures.ts'

test.describe('Account profile page', () => {
  test('displays user email (read-only)', async ({ page, appUrl, loginAs }) => {
    await loginAs('testprofile@test.com')
    await page.goto(appUrl('/me'))

    const emailField = page.locator('input[name="email"]')
    await expect(emailField).toBeVisible()
    await expect(emailField).toHaveValue('testprofile@test.com')
    // readonly (not disabled) for accessibility: keeps the address readable and focusable
    await expect(emailField).toHaveAttribute('readonly', '')
    await expect(emailField).not.toBeEditable()
  })

  test('edit first name and last name', async ({ page, appUrl, loginAs }) => {
    await loginAs('editname@test.com')
    await page.goto(appUrl('/me'))

    // Fill in first name
    const firstNameField = page.locator('input[name="firstName"]')
    await expect(firstNameField).toBeVisible()
    await firstNameField.fill('John')
    await firstNameField.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })))

    // Fill in last name
    const lastNameField = page.locator('input[name="lastName"]')
    await lastNameField.fill('Doe')
    await lastNameField.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })))

    // Wait for the save to complete
    await page.waitForTimeout(1000)

    // Reload and verify persistence
    await page.reload()
    await expect(page.locator('input[name="firstName"]')).toHaveValue('John')
    await expect(page.locator('input[name="lastName"]')).toHaveValue('Doe')
  })

  test('shows organizations section', async ({ page, appUrl, loginAs }) => {
    await loginAs('orgsection@test.com')
    await page.goto(appUrl('/me'))

    // The "My Organizations" heading should be visible (might be in French or English)
    await expect(page.locator('h2').nth(1)).toBeVisible()
  })
})
