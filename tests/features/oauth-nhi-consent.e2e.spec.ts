// The consent page for a dynamic client: an org admin binds an unverified MCP agent
// (a DCR client registered through the API) to an NHI created inline.
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { test, expect } from '../support/e2e-fixtures.ts'
import { axios, testEnvAx } from '../support/axios.ts'
import { authorizeUrl, pkcePair, startAuthorization, openInteraction, getDetails, postDecision, resume, exchangeCode, type CodeFlowOptions } from '../support/oauth-client.ts'
import { nhiBody, subject as nhiSubject } from '../support/nhi.ts'
import { issuer, password, setup, siteHost, siteUrl } from '../support/oauth-code-site.ts'

const callbackOrigin = 'http://localhost:40321'
const claudeCode = () => JSON.parse(readFileSync(new URL('../fixtures/claude-code-client-metadata.json', import.meta.url), 'utf8'))

const loginOnSite = async (page: Page, email: string) => {
  const res = await axios().post(`${issuer}/api/auth/password`, { email, password })
  await page.goto(res.data)
  await page.waitForURL(new RegExp(siteHost))
}

// the callback is reached through a redirect, which page.route does not intercept: the request
// is observed instead (the refused connection then shows as an error page, which is fine)
const captureCallback = (page: Page) => {
  let _resolve: (url: URL) => void
  const captured = new Promise<URL>(resolve => { _resolve = resolve })
  page.on('request', (request) => {
    if (request.url().startsWith(callbackOrigin + '/')) _resolve(new URL(request.url()))
  })
  return captured
}

// the native input of a v-select is covered by its field: open it through the field
const selectOf = (page: Page, name: RegExp) => page.locator('.v-select', { has: page.getByRole('combobox', { name }) })

const prepare = async (page: Page, scope: string) => {
  const { org, ownerAx } = await setup()
  await testEnvAx.patch('/config', { mainSiteFromDb: [] })
  // the user of the issuer site is an admin of the org
  await testEnvAx.patch('/user/oauth-code-user@test.com', { organizations: [{ id: org.id, name: org.name, role: 'admin' }] })
  ownerAx.setOrg(org.id)
  const registered = await axios().post(issuer + '/api/oauth/register', claudeCode(), { validateStatus: () => true })
  assert.equal(registered.status, 201, JSON.stringify(registered.data))
  await loginOnSite(page, 'oauth-code-user@test.com')
  const captured = captureCallback(page)
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

    await selectOf(page, /Compte|Account/).locator('.v-field').click()
    await page.getByRole('option', { name: new RegExp(org.name) }).click()
    await page.locator('input[name="nhiName"]').fill('Claude agent')
    await selectOf(page, /Rôle|Role/).locator('.v-field').click()
    await page.getByRole('option').last().click()
    await page.locator('[data-scope="organizations:read"] input').check()
    await expect(selectOf(page, /Durée|Duration/)).toContainText(/30/)
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
    await expect(page.locator('[data-scope="organizations"] .v-icon[title]')).toBeVisible()
    await expect(page.locator('[data-scope="organizations:read"] .v-icon[title]')).toHaveCount(0)
  })

  test('the nhi row lists the connections of a client and revokes them', async ({ page }) => {
    const { org, ownerAx } = await setup().then(async (base) => {
      await testEnvAx.patch('/config', { mainSiteFromDb: [] })
      await testEnvAx.patch('/user/oauth-code-user@test.com', { organizations: [{ id: base.org.id, name: base.org.name, role: 'admin' }] })
      base.ownerAx.setOrg(base.org.id)
      const registered = await axios().post(issuer + '/api/oauth/register', claudeCode())
      const nhi = (await base.ownerAx.post(`/api/organizations/${base.org.id}/nhis`, nhiBody({ name: 'Connected agent', subject: nhiSubject }))).data
      const opts: CodeFlowOptions = {
        issuer, clientId: registered.data.client_id, redirectUri: callbackOrigin + '/callback', scope: 'organizations:read', resource: siteUrl + '/mcp-server/mcp', browserAx: base.userAx
      }
      const { pkce, location } = await startAuthorization(opts)
      const uid = await openInteraction(opts, location)
      await getDetails(opts, uid)
      const decided = await postDecision(opts, uid, {
        decision: 'allow', account: { type: 'organization', id: base.org.id }, nhi: { id: nhi.id }, scopes: ['organizations:read'], lifetime: '30d'
      })
      const callback = await resume(opts, decided.data.redirectTo)
      await exchangeCode(opts, callback.searchParams.get('code')!, pkce.verifier)
      return base
    })
    await loginOnSite(page, 'oauth-code-user@test.com')
    await page.goto(`${issuer}/organization/${org.id}`)

    const connections = page.locator('[data-nhi-connections]')
    await expect(connections.getByText('Claude Code')).toBeVisible({ timeout: 15_000 })
    await connections.getByRole('button', { name: /Révoquer|Revoke/ }).click()
    // the menu is still opening when it first shows: a click on Ok at that moment is lost
    await expect(async () => {
      await page.getByRole('button', { name: 'Ok' }).click({ timeout: 2000 })
      await expect(connections).toBeHidden({ timeout: 2000 })
    }).toPass({ timeout: 15_000 })
    const list = (await ownerAx.get(`/api/organizations/${org.id}/nhis`)).data.results
    assert.equal((await ownerAx.get(`/api/organizations/${org.id}/nhis/${list[0].id}/oauth-grants`)).data.results.length, 0)
  })
})
