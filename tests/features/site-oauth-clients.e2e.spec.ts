import { test, expect } from '../support/e2e-fixtures.ts'
import { axios, axiosAuth, getServerConfig, testEnvAx } from '../support/axios.ts'

test.describe('Site OAuth clients editing', () => {
  let adminAx: any

  test.beforeEach(async () => {
    await testEnvAx.post('/seed')
    const config = await getServerConfig()
    adminAx = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', adminMode: true })
    const org = (await adminAx.post('/api/organizations', { name: 'test_oauth-clients-org' })).data
    await axios().post('/api/sites', {
      _id: 'test_oauth_clients_e2e',
      owner: { type: 'organization', id: org.id, name: org.name },
      host: '127.0.0.1:' + process.env.NGINX_PORT2
    }, { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_oauth_clients_e2e', {
      oauthClients: [{ name: 'Dash', redirectUris: ['https://dash.example.org/cb'], scopes: ['organizations:read'] }]
    })
  })

  test('renames a client and picks its scopes in a select of the known scopes', async ({ page, appUrl, loginExisting }) => {
    await loginExisting('_superadmin@test.com', { password: 'Test1234', adminMode: true })
    await page.goto(appUrl('/admin/sites/test_oauth_clients_e2e'))

    const name = page.getByRole('textbox', { name: 'Nom', exact: true }).last()
    await expect(name).toHaveValue('Dash', { timeout: 15_000 })
    // the list item is a read only summary until edited
    const item = page.getByRole('listitem').filter({ has: name })
    await item.hover()
    await item.getByRole('button', { name: 'Actions' }).click()
    await page.getByText('Éditer', { exact: true }).click()
    await expect(name).toBeEnabled()
    await name.fill('Dash 2')

    // the maximum scopes are a select of the known scopes, not a free text input
    await page.getByRole('combobox').filter({ hasText: 'Permissions maximales' }).click()
    await expect(page.getByRole('option', { name: 'organizations:read' })).toBeVisible()
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: /enregistrer|save/i }).click()
    await expect.poll(async () => (await adminAx.get('/api/sites/test_oauth_clients_e2e', { params: { showAll: true } })).data.oauthClients[0].name)
      .toBe('Dash 2')
  })
})
