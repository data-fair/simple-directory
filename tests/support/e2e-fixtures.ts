import { test as base, expect } from '@playwright/test'
import { testEnvAx, deleteAllEmails, directoryUrl, axios, waitForMail } from './axios.ts'

// The app is served under /simple-directory/ via nginx
const appPath = new URL(directoryUrl).pathname

type E2eFixtures = {
  /** Reset DB and emails before each test */
  resetState: void
  /** Prefix a page-relative path with the app base path */
  appUrl: (path: string) => string
  /** Create a new user via API and log them into the browser */
  loginAs: (email: string, opts?: { adminMode?: boolean, password?: string }) => Promise<void>
  /** Log in an existing (seeded) user into the browser */
  loginExisting: (email: string, opts?: { adminMode?: boolean, password?: string }) => Promise<void>
}

export const test = base.extend<E2eFixtures>({
  // eslint-disable-next-line no-empty-pattern
  resetState: [async ({}, use) => {
    await testEnvAx.delete('/')
    await deleteAllEmails()
    await use()
  }, { auto: true }],

  // eslint-disable-next-line no-empty-pattern
  appUrl: async ({}, use) => {
    await use((path: string) => `${appPath}${path.startsWith('/') ? '' : '/'}${path}`)
  },

  loginAs: async ({ page }, use) => {
    await use(async (email: string, opts?: { adminMode?: boolean, password?: string }) => {
      const password = opts?.password || 'TestPasswd01'
      const adminMode = opts?.adminMode || false
      const anonymAx = await axios()

      // Create user and wait for confirmation email
      const mail = await waitForMail(
        async () => {
          await anonymAx.post('/api/users', { email, password })
        },
        (m) => m.to === email && m.link?.includes('token_callback')
      )

      // Navigate browser to the token_callback URL to set session cookies
      const callbackUrl = mail.link
      await page.goto(callbackUrl)
      await page.waitForURL(new RegExp(appPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

      if (adminMode) {
        // Re-login with adminMode to get admin session
        const res = await anonymAx.post('/api/auth/password', { email, password, adminMode: true })
        const adminCallbackUrl = res.data
        await page.goto(adminCallbackUrl)
        await page.waitForURL(new RegExp(appPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      }
    })
  },

  loginExisting: async ({ page }, use) => {
    await use(async (email: string, opts?: { adminMode?: boolean, password?: string }) => {
      const password = opts?.password || 'TestPasswd01'
      const adminMode = opts?.adminMode || false
      const anonymAx = await axios()
      const res = await anonymAx.post('/api/auth/password', { email, password, adminMode })
      const callbackUrl = res.data
      await page.goto(callbackUrl)
      await page.waitForURL(new RegExp(appPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    })
  },
})

export { expect }
