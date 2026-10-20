import { strict as assert } from 'node:assert'
import { createServer, type Server } from 'node:http'
import { readFileSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { test, expect } from '../support/e2e-fixtures.ts'
import { axios } from '../support/axios.ts'
import { grantRecords, issuer, password, setup, siteHost } from '../support/oauth-code-site.ts'

// The dashboard scenario (phase 6b) in a real browser: a static page on another origin, no backend,
// runs the authorization code flow with PKCE and calls the SD API cross-origin with its bearer
// token. The page is the demo deployed on staging (copy of env-staging3 manifests/data-fair/oauth-demo).
const page = readFileSync(new URL('../fixtures/oauth-dashboard-demo.html', import.meta.url))

const serveDashboard = async (config: () => Record<string, any>) => {
  const server: Server = createServer((req, res) => {
    const path = new URL(req.url!, 'http://localhost').pathname
    if (path === '/config.json') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end(JSON.stringify(config()))
    }
    if (path === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      return res.end(page)
    }
    res.writeHead(404).end()
  })
  await new Promise<void>(resolve => server.listen(0, 'localhost', resolve))
  return { server, url: `http://localhost:${(server.address() as AddressInfo).port}` }
}

test.describe('OAuth dashboard on another origin', () => {
  let dashboard: Awaited<ReturnType<typeof serveDashboard>>
  let clientId = ''
  test.beforeAll(async () => {
    dashboard = await serveDashboard(() => ({ issuer, clientId, scope: 'organizations:read', dataFairUrl: '' }))
  })
  test.afterAll(async () => { dashboard.server.close() })

  test('logs in, calls the SD API cross-origin, refreshes and revokes', async ({ page: browserPage }) => {
    const setupResult = await setup({ redirectUris: [dashboard.url + '/'] })
    clientId = setupResult.clientId
    const { org } = setupResult

    // the user is logged in on the issuer site
    const login = await axios().post(`${issuer}/api/auth/password`, { email: 'oauth-code-user@test.com', password })
    await browserPage.goto(login.data)
    await browserPage.waitForURL(new RegExp(siteHost))

    await browserPage.goto(dashboard.url + '/')
    await browserPage.getByRole('button', { name: /Connect with my Koumoul/ }).click()

    await expect(browserPage.getByRole('heading', { name: /Dash/ })).toBeVisible({ timeout: 15_000 })
    await browserPage.locator('.v-select .v-field').click()
    await browserPage.getByRole('option', { name: new RegExp(org.name) }).click()
    await browserPage.getByRole('button', { name: /Autoriser|Allow/ }).click()

    // back on the dashboard: the token exchange and the API calls were cross-origin browser requests
    await browserPage.waitForURL(dashboard.url + '/')
    await expect(browserPage.locator('p', { hasText: 'Connected as' })).toContainText(`acting for ${org.name}`)
    await expect(browserPage.locator('[data-call="me"] [data-status]')).toHaveAttribute('data-status', '200')
    // refused by the scopes, and the refusal is readable by the page (not a CORS failure)
    await expect(browserPage.locator('[data-call="users"] [data-status]')).toHaveAttribute('data-status', '403')

    await browserPage.getByRole('button', { name: 'Refresh the token' }).click()
    await expect(browserPage.locator('[data-call="me"] [data-status]')).toHaveAttribute('data-status', '200')
    assert.equal((await grantRecords({ clientId })).length, 1)

    await browserPage.getByRole('button', { name: /Disconnect/ }).click()
    await expect(browserPage.getByRole('button', { name: /Connect with my Koumoul/ })).toBeVisible()
    await expect.poll(async () => (await grantRecords({ clientId })).length).toBe(0)
  })
})
