import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, testEnvAx, createUser, getServerConfig } from '../support/axios.ts'

// site-level OIDC providers are not operator-declared: their discovery goes through the public
// agents of @data-fair/lib-node that refuse non public addresses. The cloud metadata address
// stays refused in dev/test, where SSRF_PUBLIC_IPS only makes loopback public, and the agent
// refuses an IP literal before connecting so nothing is sent to it.
test.describe('OIDC SSRF protection', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('site-level OIDC discovery to a non public address is refused', async () => {
    const config = await getServerConfig()
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const anonymousAx = await axios()

    const org = (await adminAx.post('/api/organizations', { name: 'SSRF Org' })).data
    const owner = { type: 'organization', id: org.id, name: org.name }
    const host = `127.0.0.1:${process.env.NGINX_PORT2}`
    await anonymousAx.post('/api/sites',
      { _id: 'test_ssrf_site', owner, host, theme: { primaryColor: '#000000' } },
      { params: { key: config.secretKeys.sites } })
    await adminAx.patch('/api/sites/test_ssrf_site', {
      authMode: 'onlyLocal',
      authProviders: [{
        type: 'oidc',
        title: 'Metadata Idp',
        discovery: 'http://169.254.169.254/.well-known/openid-configuration',
        client: { id: 'test-client', secret: 'test-secret' }
      }]
    })
    await testEnvAx.post('/clear-site-cache')

    const siteAx = await axios({ baseURL: `http://${host}/simple-directory` })
    const res = await siteAx.get('/api/auth/oidc/169254169254/login', { validateStatus: () => true })
    assert.equal(res.status, 500)
    // the dev server returns the stack of server errors, it must be the refusal of the public agent
    // and not a network error, that a private agent would also produce on a host without this route
    assert.match(String(res.data), /SsrfError.*169\.254\.169\.254 refused, it is not a public address/)
  })
})
