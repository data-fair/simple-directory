import { test, expect } from '../support/e2e-fixtures.ts'
import { axios } from '../support/axios.ts'
import { runCodeFlow } from '../support/oauth-client.ts'
import { issuer, password, setup } from '../support/oauth-code-site.ts'

test.describe('connected applications on the account page', () => {
  test('lists the client of a grant and revokes it', async ({ page }) => {
    const { flow } = await setup()
    await runCodeFlow(flow())
    const res = await axios().post(`${issuer}/api/auth/password`, { email: 'oauth-code-user@test.com', password })
    await page.goto(res.data)
    await page.goto(`${issuer}/me`)

    const section = page.locator('[data-connected-applications]')
    await expect(section.getByText('Dash')).toBeVisible({ timeout: 15_000 })
    await section.getByRole('button', { name: /Révoquer|Revoke/ }).click()
    await page.getByRole('button', { name: 'Ok' }).click()
    await expect(section.getByText('Dash')).toBeHidden()
  })
})
