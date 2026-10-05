import { test, expect } from '../support/e2e-fixtures.ts'
import { axios, axiosAuth, createUser, getServerConfig, testEnvAx } from '../support/axios.ts'

// On the main site of an organization, the root admins of the organization manage the
// accounts of the site from the organization page (siteAdmin).
test.describe('Site admin on the organization page', () => {
  const host2 = '127.0.0.1:' + process.env.NGINX_PORT2
  const siteDirectoryUrl = `http://${host2}/simple-directory`
  let org: any

  test.beforeEach(async () => {
    const config = await getServerConfig()
    const adminAx = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', adminMode: true })
    org = (await adminAx.post('/api/organizations', { name: 'test_site_admin_org' })).data
    const owner = { type: 'organization', id: org.id, name: org.name }
    await (await axios()).post('/api/sites',
      { _id: 'test_site_admin_e2e', owner, host: host2, theme: { primaryColor: '#FF00FF' } },
      { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_site_admin_e2e', { isAccountMain: true })
    await testEnvAx.post('/clear-site-cache')

    await createUser('site-admin-e2e@test.com', false, 'TestPasswd01', siteDirectoryUrl)
    await testEnvAx.patch('/user/site-admin-e2e@test.com', { organizations: [{ id: org.id, name: org.name, role: 'admin' }] })
    await createUser('site-member-e2e@test.com', false, 'TestPasswd01', siteDirectoryUrl)
    await testEnvAx.patch('/user/site-member-e2e@test.com', { plannedDeletion: '2099-01-01' })
  })

  test('lists the accounts of the site in the toc and cancels a planned deletion', async ({ page }) => {
    const res = await (await axios()).post(`${siteDirectoryUrl}/api/auth/password`, { email: 'site-admin-e2e@test.com', password: 'TestPasswd01', org: org.id })
    await page.goto(res.data)
    await page.waitForURL(new RegExp(host2))

    await page.goto(`${siteDirectoryUrl}/organization/${org.id}`)
    await expect(page.getByRole('heading', { name: /Comptes du site/ })).toBeVisible({ timeout: 15_000 })

    // the table of contents links to the section
    const tocItem = page.locator('#navigation-right-local').getByText('Comptes du site')
    await expect(tocItem).toBeVisible()
    await tocItem.click()

    const memberRow = page.getByRole('row').filter({ hasText: 'site-member-e2e@test.com' })
    await expect(memberRow).toBeVisible()
    // no action on their own account
    await expect(page.getByRole('row').filter({ hasText: 'site-admin-e2e@test.com' }).getByRole('button')).toHaveCount(0)

    await memberRow.getByRole('button', { name: /Annuler la suppression planifiée/ }).click()
    await expect(memberRow.getByRole('button', { name: /Annuler la suppression planifiée/ })).toHaveCount(0)
  })
})
