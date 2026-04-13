import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'dot',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: `http://${process.env.DEV_HOST || 'localhost'}:${process.env.NGINX_PORT1}/simple-directory`,
    actionTimeout: 5_000,
    navigationTimeout: 5_000,
  },

  projects: [
    {
      name: 'state-setup',
      testMatch: /state-setup\.ts/,
      teardown: 'state-teardown'
    },
    {
      name: 'state-teardown',
      testMatch: /state-teardown\.ts/,
    },
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      dependencies: ['state-setup'],
    },
    {
      name: 'unit',
      testMatch: /.*\.unit\.spec\.ts/,
      dependencies: ['api'],
    },
    {
      name: 'api-inproc-ldap',
      testMatch: /ldap-api\.inproc\.spec\.ts/,
      dependencies: ['unit'],
    },
    {
      name: 'api-inproc-oidc',
      testMatch: /oidc-ldap\.inproc\.spec\.ts/,
      dependencies: ['api-inproc-ldap'],
    },
    {
      name: 'e2e',
      testMatch: /.*\.e2e\.spec\.ts/,
      dependencies: ['state-setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
