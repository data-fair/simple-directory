import { test, expect } from '../support/e2e-fixtures.ts'
import type { Page } from '@playwright/test'
import { axios, createUser, testEnvAx } from '../support/axios.ts'

// an organization admin with a browser session on the organization, and a second member
// (a second admin by default, so that the session user is not the last admin)
const setup = async (page: Page, memberRole = 'admin') => {
  const { ax } = await createUser('test-selfadmin@test.com')
  await createUser('test-selfmember@test.com')
  const org = (await ax.post('/api/organizations', { name: 'Org' })).data
  ax.setOrg(org.id)
  // api specs leave this off, the invitation must add the member directly
  await testEnvAx.patch('/config', { alwaysAcceptInvitation: true })
  await ax.post('/api/invitations', { id: org.id, name: org.name, email: 'test-selfmember@test.com', role: memberRole })
  await testEnvAx.patch('/config', { alwaysAcceptInvitation: false })
  const callbackUrl = (await (await axios()).post('/api/auth/password', { email: 'test-selfadmin@test.com', password: 'TestPasswd01', org: org.id })).data
  await page.goto(callbackUrl)
  return { org }
}

const memberItem = (page: Page, email: string) => page.getByRole('listitem').filter({ hasText: email })

test.describe('Members menus warn about actions on yourself', () => {
  test('removing your own membership shows the self warning, not for another member', async ({ page, appUrl }) => {
    const { org } = await setup(page)
    await page.goto(appUrl(`/organization/${org.id}`))
    const menu = page.locator('.v-overlay--active .v-card')

    await expect(memberItem(page, 'test-selfmember@test.com')).toBeVisible({ timeout: 15000 })
    await memberItem(page, 'test-selfadmin@test.com').getByRole('button', { name: /supprimer cet utilisateur/i }).click()
    await expect(menu).toContainText('votre propre appartenance')
    await menu.getByRole('button', { name: /annuler/i }).click()
    await expect(menu).toHaveCount(0)

    await memberItem(page, 'test-selfmember@test.com').getByRole('button', { name: /supprimer cet utilisateur/i }).click()
    await expect(menu).toContainText('Voulez-vous vraiment supprimer')
    await expect(menu).not.toContainText('votre propre appartenance')
  })

  test('changing your own role shows the self warning', async ({ page, appUrl }) => {
    const { org } = await setup(page)
    await page.goto(appUrl(`/organization/${org.id}`))
    const menu = page.locator('.v-overlay--active .v-card')

    await expect(memberItem(page, 'test-selfmember@test.com')).toBeVisible({ timeout: 15000 })
    await memberItem(page, 'test-selfadmin@test.com').getByRole('button', { name: /modifier/i }).click()
    await expect(menu).toBeVisible()
    await expect(menu).not.toContainText('votre propre rôle')
    await menu.locator('.v-select').click()
    await page.getByRole('option').filter({ hasText: /^user$/ }).click()
    await expect(menu).toContainText('votre propre rôle')
    await expect(menu.getByRole('button', { name: 'Ok' })).toBeEnabled()
  })

  test('the last admin can neither leave nor change their own role', async ({ page, appUrl }) => {
    const { org } = await setup(page, 'user')
    await page.goto(appUrl(`/organization/${org.id}`))
    const menu = page.locator('.v-overlay--active .v-card')

    await expect(memberItem(page, 'test-selfmember@test.com')).toBeVisible({ timeout: 15000 })
    await memberItem(page, 'test-selfadmin@test.com').getByRole('button', { name: /supprimer cet utilisateur/i }).click()
    await expect(menu).toContainText('dernier administrateur')
    await expect(menu.getByRole('button', { name: 'Ok' })).toBeDisabled()
    await menu.getByRole('button', { name: /annuler/i }).click()
    await expect(menu).toHaveCount(0)

    await memberItem(page, 'test-selfadmin@test.com').getByRole('button', { name: /modifier/i }).click()
    await menu.locator('.v-select').click()
    await page.getByRole('option').filter({ hasText: /^user$/ }).click()
    await expect(menu).toContainText('dernier administrateur')
    await expect(menu.getByRole('button', { name: 'Ok' })).toBeDisabled()
  })
})
