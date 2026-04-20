import { strict as assert } from 'node:assert'
import { spawn } from 'child_process'
import { axiosBuilder } from '@data-fair/lib-node/axios.js'
import { test as setup } from '@playwright/test'
import { devApiUrl } from './support/axios.ts'

const ax = axiosBuilder()

setup('Stateful tests setup', async () => {
  // Check that the dev API server is up
  await assert.doesNotReject(
    ax.get(`${devApiUrl}/api/test-env/ping`),
    `Dev API server seems to be unavailable at ${devApiUrl}.
If you are an agent do not try to start it. Instead check for a startup failure at the end of dev/logs/dev-api.log and report this problem to your user.`
  )

  // drop the anonymous-action notBefore to 0 so tests don't wait 8s per user creation
  // (the 8s delay is a bot trap; programmatic tests are not bots)
  await ax.patch(`${devApiUrl}/api/test-env/config`, { anonymousAction: { expiresIn: '1d', notBefore: '0s' } })

  // Check that the mock OIDC servers are up
  const mockOidcPort1 = parseInt(process.env.MOCK_OIDC_PORT1 || '8998')
  const mockOidcPort2 = parseInt(process.env.MOCK_OIDC_PORT2 || '8999')
  await assert.doesNotReject(
    ax.get(`http://localhost:${mockOidcPort1 + 100}/_test/ping`),
    `Mock OIDC server 1 control is unavailable on port ${mockOidcPort1 + 100}. Start it with: npm run dev-mock-oidc`
  )
  await assert.doesNotReject(
    ax.get(`http://localhost:${mockOidcPort2 + 100}/_test/ping`),
    `Mock OIDC server 2 control is unavailable on port ${mockOidcPort2 + 100}. Start it with: npm run dev-mock-oidc`
  )

  // More visible dev server logs straight in the test output
  try {
    const { existsSync, mkdirSync } = await import('node:fs')
    if (!existsSync('dev/logs')) mkdirSync('dev/logs', { recursive: true })
    const tailApi = spawn('tail', ['-n', '0', '-f', 'dev/logs/dev-api.log'], { stdio: 'inherit', detached: true })
    process.env.TAIL_PIDS = [tailApi.pid].filter(Boolean).join(',')
  } catch {
    // log tailing is optional
  }
})
