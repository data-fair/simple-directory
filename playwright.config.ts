import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

// the test infrastructure (dev API, maildev, mock OIDC servers, in-process API servers) is on
// loopback, that the SSRF protection of @data-fair/lib-node's public agents refuses by default
process.env.SSRF_PUBLIC_IPS = process.env.SSRF_PUBLIC_IPS || '127.0.0.1,::1'

const ci = !!process.env.CI
// e2e browser engine: chromium by default, the nightly run rotates firefox and webkit in
const engines: Record<string, string> = { chromium: 'Desktop Chrome', firefox: 'Desktop Firefox', webkit: 'Desktop Safari' }
const browser = devices[engines[process.env.TEST_BROWSER || 'chromium']]
if (!browser) throw new Error(`unknown TEST_BROWSER ${process.env.TEST_BROWSER}, expected one of ${Object.keys(engines).join(', ')}`)

export default defineConfig({
  testDir: './tests',
  // api and e2e tests share the dev env state (e2e tests reset the whole database): one worker
  workers: 1,
  fullyParallel: false,
  forbidOnly: ci,
  // a flake must not cost a full re-run; the nightly run sets TEST_RETRIES=0 to expose flaky tests
  retries: ci ? Number(process.env.TEST_RETRIES || 1) : 0,
  // the json report keeps the per-test durations of the last run, used to size the smoke set
  reporter: [['dot'], ['json', { outputFile: 'dev/logs/test-timings.json' }]],
  // per test, HOOKS INCLUDED: heavy specs call test.slow() (x3) instead of raising this
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: `http://${process.env.DEV_HOST || 'localhost'}:${process.env.NGINX_PORT1}/simple-directory`,
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'unit',
      testMatch: /.*\.unit\.spec\.ts/,
    },
    {
      name: 'state-setup',
      testMatch: /state-setup\.ts/,
    },
    {
      name: 'api',
      testMatch: /.*\.api\.spec\.ts/,
      dependencies: ['state-setup'],
    },
    {
      // in-process API servers on their own config (LDAP storage, OIDC + LDAP), not the dev API
      name: 'api-inproc-ldap',
      testMatch: /ldap-api\.inproc\.spec\.ts/,
    },
    {
      name: 'api-inproc-oidc',
      testMatch: /oidc-ldap\.inproc\.spec\.ts/,
    },
    {
      name: 'e2e',
      testMatch: /.*\.e2e\.spec\.ts/,
      dependencies: ['state-setup'],
      // full page loads (incl. superadmin login) can exceed 10s when the whole suite loads the server
      use: { ...browser, navigationTimeout: 15_000 },
    },
  ],
})
