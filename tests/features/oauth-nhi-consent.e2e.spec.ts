// The consent page for a dynamic client (spec 9.3): an org admin binds an unverified MCP agent
// (a DCR client registered through the API) to an NHI created inline.
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { test, expect } from '../support/e2e-fixtures.ts'
import { axios, testEnvAx } from '../support/axios.ts'
import { authorizeUrl, pkcePair } from '../support/oauth-client.ts'
import { issuer, password, setup, siteHost, siteUrl } from '../support/oauth-code-site.ts'

const callbackOrigin = 'http://localhost:40321'
const claudeCode = () => JSON.parse(readFileSync(new URL('../fixtures/claude-code-client-metadata.json', import.meta.url), 'utf8'))

const loginOnSite = async (page: Page, email: string) => {
  const res = await axios().post(`${issuer}/api/auth/password`, { email, password })
  await page.goto(res.data)
  await page.waitForURL(new RegExp(siteHost))
}

const captureCallback = async (page: Page) => {
  let _resolve: (url: URL) => void
  const captured = new Promise<URL>(resolve => { _resolve = resolve })
  await page.route(callbackOrigin + '/**', async (route) => {
    _resolve(new URL(route.request().url()))
    await route.fulfill({ status: 200, body: 'callback' })
  })
  return captured
}

const prepare = async (page: Page, scope: string) => {
  const { org, ownerAx } = await setup()
  await testEnvAx.patch('/config', { mainSiteFromDb: [] })
  // the user of the issuer site is an admin of the org
  await testEnvAx.patch('/user/oauth-code-user@test.com', { organizations: [{ id: org.id, name: org.name, role: 'admin' }] })
  ownerAx.setOrg(org.id)
  const registered = await axios().post(issuer + '/api/oauth/register', claudeCode(), { validateStatus: () => true })
  assert.equal(registered.status, 201, JSON.stringify(registered.data))
  await loginOnSite(page, 'oauth-code-user@test.com')
  const captured = await captureCallback(page)
  const url = authorizeUrl(issuer, {
    client_id: registered.data.client_id,
    response_type: 'code',
    redirect_uri: callbackOrigin + '/callback',
    scope,
    resource: siteUrl + '/mcp-server/mcp',
    state: 'e2e',
    code_challenge: pkcePair().challenge,
    code_challenge_method: 'S256'
  })
  return { org, ownerAx, captured, url }
}

test.describe('OAuth NHI consent page', () => {
  test('an org admin creates an identity inline and authorizes the client', async ({ page }) => {
    const { org, ownerAx, captured, url } = await prepare(page, 'organizations:read')
    await page.goto(url)

    await expect(page.locator('[data-unverified]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-unverified]')).toContainText(/automatiquement|automatically/)
    await expect(page.locator('[data-resource]')).toContainText(/MCP/)
    await expect(page.locator('[data-redirect-host]')).toContainText('localhost:40321')
    // nothing preselected, so no confirmation yet
    await expect(page.locator('[data-scope="organizations:read"] input')).not.toBeChecked()
    const allow = page.getByRole('button', { name: /Autoriser|Allow/ })
    await expect(allow).toBeDisabled()

    await page.getByRole('combobox', { name: /Compte|Account/ }).click()
    await page.getByRole('option', { name: new RegExp(org.name) }).click()
    await page.locator('input[name="nhiName"]').fill('Claude agent')
    await page.getByRole('combobox', { name: /Rôle|Role/ }).click()
    await page.getByRole('option').last().click()
    await page.locator('[data-scope="organizations:read"] input').check()
    await expect(page.getByRole('combobox', { name: /Durée|Duration/ })).toContainText(/30/)
    await expect(allow).toBeEnabled()
    await allow.click()

    const callback = await captured
    assert.ok(callback.searchParams.get('code'), callback.href)
    const nhis = (await ownerAx.get(`/api/organizations/${org.id}/nhis`)).data.results
    const created = nhis.find((n: any) => n.name === 'Claude agent')
    assert.ok(created, 'the inline nhi is listed')
    assert.deepEqual(created.scopes, ['organizations:read'])
  })

  test('a broad requested scope shows a warning', async ({ page }) => {
    const { url } = await prepare(page, 'organizations organizations:read')
    await page.goto(url)
    await expect(page.locator('[data-unverified]')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-scope="organizations"] .mdi-shield-alert, [data-scope="organizations"] svg')).toBeVisible()
    await expect(page.locator('[data-scope="organizations:read"] svg')).toHaveCount(0)
  })
})
