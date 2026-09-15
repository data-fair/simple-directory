import { test, expect } from '../support/e2e-fixtures.ts'
import type { Page } from '@playwright/test'
import { generateKeyPairSync } from 'node:crypto'
import { axios, createUser } from '../support/axios.ts'

// a user, an organization with an overridden admin label and a browser session on that organization
const setupOrgAdmin = async (page: Page) => {
  const { ax } = await createUser('orgadmin@test.com')
  const org = (await ax.post('/api/organizations', { name: 'Org' })).data
  ax.setOrg(org.id)
  await ax.patch(`/api/organizations/${org.id}`, { rolesLabels: { admin: 'Gestionnaire' } })
  // open a session on the organization account, the members list is only served to it
  const callbackUrl = (await (await axios()).post('/api/auth/password', { email: 'orgadmin@test.com', password: 'TestPasswd01', org: org.id })).data
  await page.goto(callbackUrl)
  return { ax, org }
}

// the role selectors of the members menus must show the labels of the organization, not the raw keys
test.describe('Roles labels in the organization menus', () => {
  test('the invitation menu offers the overridden label', async ({ page, appUrl }) => {
    const { org } = await setupOrgAdmin(page)
    await page.goto(appUrl(`/organization/${org.id}`))

    await page.getByRole('button', { name: /inviter un utilisateur/i }).click()
    const menu = page.locator('.v-overlay--active .v-card')
    await expect(menu).toBeVisible()
    await menu.locator('.v-select').click()
    const options = page.getByRole('option')
    await expect(options.filter({ hasText: 'Gestionnaire' })).toHaveCount(1)
    await expect(options.filter({ hasText: /^admin$/ })).toHaveCount(0)
  })

  test('the account page lists the memberships with the overridden label', async ({ page, appUrl }) => {
    await setupOrgAdmin(page)
    await page.goto(appUrl('/me'))
    await expect(page.getByText('Org (Gestionnaire)')).toBeVisible()
  })

  test('the service accounts list shows the overridden label', async ({ page, appUrl }) => {
    const { ax, org } = await setupOrgAdmin(page)
    const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const jwks = { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' }] }
    await ax.post(`/api/organizations/${org.id}/nhis`, { name: 'My agent', role: 'admin', subject: 'system:serviceaccount:agents:my-agent', provider: { issuer: 'https://test-issuer.example.com', jwks } })

    await page.goto(appUrl(`/organization/${org.id}`))
    const agent = page.getByRole('listitem').filter({ hasText: 'My agent' })
    await expect(agent).toContainText('Rôle = Gestionnaire')
  })
})
