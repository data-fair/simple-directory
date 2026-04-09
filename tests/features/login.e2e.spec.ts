import { test, expect } from '../support/e2e-fixtures.ts'
import { testEnvAx, waitForMail } from '../support/axios.ts'

test.describe('Login page', () => {
  test('renders login form', async ({ page, appUrl }) => {
    await page.goto(appUrl('/login'))
    // The login page has delayedRendering that waits for auth providers to load
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('login with email and password', async ({ page, appUrl }) => {
    await testEnvAx.post('/seed')

    await page.goto(appUrl('/login'))
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10_000 })
    await page.locator('input[name="email"]').fill('dmeadus0@answers.com')
    await page.locator('input[name="password"]').fill('TestPasswd01')
    await page.locator('input[name="password"]').press('Enter')

    // After login, should redirect away from login page
    await page.waitForURL(/\/simple-directory\/(?!login)/, { timeout: 10_000 })
    // Verify we're authenticated by checking the /me page
    await page.goto(appUrl('/me'))
    await expect(page.locator('input[name="email"]')).toHaveValue('dmeadus0@answers.com', { timeout: 10_000 })
  })

  test('login with wrong password shows error', async ({ page, appUrl }) => {
    await testEnvAx.post('/seed')

    await page.goto(appUrl('/login'))
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 10_000 })
    await page.locator('input[name="email"]').fill('dmeadus0@answers.com')
    await page.locator('input[name="password"]').fill('WrongPassword1')
    await page.locator('input[name="password"]').press('Enter')

    // Should show an error alert
    await expect(page.locator('.v-alert')).toBeVisible({ timeout: 10_000 })
  })

  test('create new user account', async ({ page, appUrl }) => {
    // Navigate directly to the create user step via URL param
    await page.goto(appUrl('/login?step=createUser'))

    // Fill the create user form
    await expect(page.locator('input[name="createuser-email"]')).toBeVisible({ timeout: 10_000 })
    await page.locator('input[name="createuser-email"]').fill('newuser@test.com')
    await page.locator('input[name="newUserPassword"]').fill('TestPasswd01')
    await page.locator('input[name="newUserPassword2"]').fill('TestPasswd01')

    // Start listening for confirmation email before submitting
    const mailPromise = waitForMail(
      () => page.locator('input[name="newUserPassword2"]').press('Enter'),
      (m) => m.to === 'newuser@test.com'
    )

    const mail = await mailPromise
    expect(mail.to).toBe('newuser@test.com')
    expect(mail.link).toContain('token_callback')
  })
})
