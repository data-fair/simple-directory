import { strict as assert } from 'node:assert'
import type { Page } from '@playwright/test'
import { test, expect } from '../support/e2e-fixtures.ts'
import { axios } from '../support/axios.ts'
import { authorizeUrl, pkcePair, type CodeFlowOptions } from '../support/oauth-client.ts'
import { issuer, password, setup, siteHost } from '../support/oauth-code-site.ts'

// the user logs in on the issuer site, the client callback has nothing listening: the browser
// request to it is intercepted and its url captured
const loginOnSite = async (page: Page, email: string) => {
  const res = await axios().post(`${issuer}/api/auth/password`, { email, password })
  await page.goto(res.data)
  await page.waitForURL(new RegExp(siteHost))
}

// the authorization request is made by the browser itself: the provider cookies must be its own
const pageAuthorizeUrl = (opts: CodeFlowOptions) => authorizeUrl(opts.issuer, {
  client_id: opts.clientId,
  response_type: 'code',
  redirect_uri: opts.redirectUri,
  scope: opts.scope,
  state: 'e2e',
  code_challenge: pkcePair().challenge,
  code_challenge_method: 'S256'
})

// the callback is reached through a redirect, which page.route does not intercept: the request
// is observed instead (the refused connection then shows as an error page, which is fine)
const captureCallback = (page: Page) => {
  let _resolve: (url: URL) => void
  const captured = new Promise<URL>(resolve => { _resolve = resolve })
  page.on('request', (request) => {
    if (request.url().startsWith('http://localhost:5999/')) _resolve(new URL(request.url()))
  })
  return captured
}

test.describe('OAuth consent page', () => {
  test('allow: shows the client and the scopes, picks the org and returns a code', async ({ page }) => {
    const { org, flow } = await setup()
    await loginOnSite(page, 'oauth-code-user@test.com')
    const captured = captureCallback(page)

    await page.goto(pageAuthorizeUrl(flow()))

    await expect(page.getByRole('heading', { name: /Dash/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/Lire les organisations|Read organizations/)).toBeVisible()
    await expect(page.locator('[data-redirect-host]')).toContainText('localhost:5999')
    await expect(page.locator('[data-scope="organizations:read"] input')).toBeChecked()

    // the native input of a v-select is covered by its field
    await page.locator('.v-select .v-field').click()
    await page.getByRole('option', { name: new RegExp(org.name) }).click()
    await page.getByRole('button', { name: /Autoriser|Allow/ }).click()

    const callback = await captured
    assert.ok(callback.searchParams.get('code'), callback.href)
    assert.equal(callback.searchParams.get('iss'), issuer)
  })

  test('deny returns access_denied', async ({ page }) => {
    const { flow } = await setup()
    await loginOnSite(page, 'oauth-code-user@test.com')
    const captured = captureCallback(page)
    await page.goto(pageAuthorizeUrl(flow()))
    await page.getByRole('button', { name: /Refuser|Deny/ }).click()
    const callback = await captured
    assert.equal(callback.searchParams.get('error'), 'access_denied')
  })

  test('shows the expired message', async ({ page, appUrl }) => {
    await page.goto(appUrl('/oauth/consent?error=interaction_expired'))
    await expect(page.locator('[data-error]')).toContainText(/expiré|expired/)
  })

  test('shows a generic message for a provider error code', async ({ page, appUrl }) => {
    await page.goto(appUrl('/oauth/consent?error=invalid_client'))
    await expect(page.locator('[data-error]')).toContainText('invalid_client')
  })
})
