// The first hit of each UI route is slow on a cold vite (transforms, the vjsf site form of
// several hundred kB): this pays for it once, with long timeouts, before the e2e tests.
import { test, expect } from './support/e2e-fixtures.ts'
import { axios, axiosAuth, getServerConfig, testEnvAx } from './support/axios.ts'

test('warm up the heavy UI routes', async ({ page, appUrl, loginExisting }, testInfo) => {
  const t0 = Date.now()
  const step = (name: string) => testInfo.annotations.push({ type: 'warmup', description: `${name}: ${Date.now() - t0} ms` })

  await page.goto(appUrl('/login'))
  await expect(page.locator('input[type=password]')).toBeVisible()
  step('login page')

  await testEnvAx.post('/seed')
  const config = await getServerConfig()
  const adminAx = await axiosAuth({ email: '_superadmin@test.com', password: 'Test1234', adminMode: true })
  const org = (await adminAx.post('/api/organizations', { name: 'test_warmup-org' })).data
  await (await axios()).post('/api/sites', {
    _id: 'test_warmup_site',
    owner: { type: 'organization', id: org.id, name: org.name },
    host: 'warmup.localhost',
    title: 'Warmup'
  }, { params: { key: config.secretKeys.sites } })

  await loginExisting('_superadmin@test.com', { password: 'Test1234', adminMode: true })
  await page.goto(appUrl('/me'))
  await expect(page.getByRole('heading', { name: 'Informations personnelles' })).toBeVisible()
  step('me page')

  await page.goto(appUrl('/admin/sites/test_warmup_site'))
  await expect(page.getByText('Gestion des utilisateurs')).toBeVisible()
  step('site edit form')

  // nothing left to optimise: a reload must not trigger a new vite dependency pass
  await page.reload()
  await expect(page.getByText('Gestion des utilisateurs')).toBeVisible()
  step('site edit form reloaded')
})
