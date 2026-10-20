import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx } from '../support/axios.ts'
import { runCodeFlow } from '../support/oauth-client.ts'
import { issuer, setup } from '../support/oauth-code-site.ts'

// a dashboard on another domain calls the SD API with its bearer token (phase 6b)
const dashboardOrigin = 'https://dashboard.example.org'
const anon = () => axios()
const call = (method: string, path: string, headers: Record<string, string>) =>
  anon().request({ method, url: issuer + path, headers: { origin: dashboardOrigin, ...headers }, validateStatus: () => true })

test.describe('CORS on bearer calls to the SD API', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { mainSiteFromDb: [] })
  })

  test('a dashboard token reads the API cross-origin, without credentials', async () => {
    const { org, flow } = await setup()
    const { tokens } = await runCodeFlow(flow({ decision: { account: { type: 'organization', id: org.id } } }))

    const preflight = await call('OPTIONS', `/api/organizations/${org.id}`, {
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'authorization'
    })
    assert.equal(preflight.status, 204)
    assert.equal(preflight.headers['access-control-allow-origin'], '*')
    assert.match(preflight.headers['access-control-allow-headers'], /Authorization/)
    assert.equal(preflight.headers['access-control-allow-credentials'], undefined)

    const res = await call('GET', `/api/organizations/${org.id}`, { authorization: 'Bearer ' + tokens.access_token })
    assert.equal(res.status, 200)
    assert.equal(res.data.id, org.id)
    assert.equal(res.headers['access-control-allow-origin'], '*')
    assert.equal(res.headers['access-control-allow-credentials'], undefined)

    const me = await call('GET', '/api/auth/me', { authorization: 'Bearer ' + tokens.access_token })
    assert.equal(me.status, 200)
    assert.equal(me.headers['access-control-allow-origin'], '*')
  })

  test('errors of bearer calls are readable cross-origin', async () => {
    const res = await call('GET', '/api/auth/me', { authorization: 'Bearer not-a-token' })
    assert.equal(res.status, 401)
    assert.equal(res.headers['access-control-allow-origin'], '*')
  })

  test('calls without a bearer token get no CORS header', async () => {
    const res = await call('GET', '/api/auth/me', {})
    assert.equal(res.headers['access-control-allow-origin'], undefined)
    const preflight = await call('OPTIONS', '/api/auth/me', {
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'content-type'
    })
    assert.equal(preflight.headers['access-control-allow-origin'], undefined)
  })

  // per-client CORS of the token endpoint is tested in oauth-refresh.api.spec.ts
  test('the authorization server endpoints are not opened to every origin', async () => {
    await setup()
    const preflight = await call('OPTIONS', '/api/oauth/token', {
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'authorization'
    })
    assert.notEqual(preflight.headers['access-control-allow-origin'], '*')
  })
})
