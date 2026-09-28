import { strict as assert } from 'node:assert'
import { createServer, type Server } from 'node:http'
import { test } from '@playwright/test'
import { testEnvAx, createUser } from '../support/axios.ts'

// a tiny receiver standing for a service, called by the API server on the same host
type Received = { method: string, path: string, secret: string | undefined, body: any }
const received: Received[] = []
let receiver: Server
let receiverPort: number

const waitForWebhook = async (predicate: (r: Received) => boolean) => {
  for (let i = 0; i < 50; i++) {
    const found = received.find(predicate)
    if (found) return found
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('webhook not received: ' + JSON.stringify(received, null, 2))
}

test.describe('identities webhooks', () => {
  test.beforeAll(async () => {
    receiver = createServer((req, res) => {
      let data = ''
      req.on('data', chunk => { data += chunk })
      req.on('end', () => {
        const path = new URL(req.url as string, 'http://127.0.0.1').pathname
        received.push({ method: req.method as string, path, secret: req.headers['x-secret-key'] as string | undefined, body: data ? JSON.parse(data) : undefined })
        res.statusCode = 200
        res.end()
      })
    })
    await new Promise<void>(resolve => receiver.listen(0, '127.0.0.1', () => resolve()))
    receiverPort = (receiver.address() as { port: number }).port
  })
  test.afterAll(async () => {
    await testEnvAx.patch('/config', { webhooks: { identities: [] } })
    receiver.close()
  })
  test.beforeEach(async () => {
    received.length = 0
    await testEnvAx.delete('/')
    await testEnvAx.patch('/config', { webhooks: { identities: [{ base: `http://127.0.0.1:${receiverPort}/identities`, key: 'webhook-secret' }] } })
  })

  test('should send the organization state, partners included, at each partnership change', async () => {
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const { ax } = await createUser('test-webhooks1@test.com')
    const host = (await ax.post('/api/organizations', { name: 'Host org', departments: [{ id: 'dep1', name: 'Department 1' }] })).data
    const partner = (await adminAx.post('/api/organizations', { name: 'Partner org' })).data

    // creation: no partner yet
    const created = await waitForWebhook(r => r.method === 'POST' && r.path.endsWith('/identities/organization/' + host.id))
    assert.equal(created.secret, 'webhook-secret')
    assert.equal(created.body.name, 'Host org')
    assert.deepEqual(created.body.departments, [{ id: 'dep1', name: 'Department 1' }])
    assert.deepEqual(created.body.partners, [])
    received.length = 0

    // an established partnership is sent
    await adminAx.post(`/api/organizations/${host.id}/partners/_create`, { id: partner.id })
    const withPartner = await waitForWebhook(r => r.method === 'POST' && r.path.endsWith('/identities/organization/' + host.id))
    assert.deepEqual(withPartner.body.partners, [{ id: partner.id, name: 'Partner org' }])
    received.length = 0

    // a pending invitation is not sent
    ax.setOrg(host.id)
    await ax.post(`/api/organizations/${host.id}/partners`, { name: 'Invited org', contactEmail: 'test-webhooks2@test.com' })
    await new Promise(resolve => setTimeout(resolve, 300))
    assert.equal(received.length, 0)

    // removing the partner sends the state without it
    const hostInfo = (await ax.get('/api/organizations/' + host.id)).data
    const establishedPartner = hostInfo.partners.find((p: any) => p.id === partner.id)
    await ax.delete(`/api/organizations/${host.id}/partners/${establishedPartner.partnerId}`)
    const withoutPartner = await waitForWebhook(r => r.method === 'POST' && r.path.endsWith('/identities/organization/' + host.id))
    assert.deepEqual(withoutPartner.body.partners, [])
  })

  test('should send the deletion of an organization', async () => {
    const { ax: adminAx } = await createUser('admin@test.com', true)
    const org = (await adminAx.post('/api/organizations', { name: 'Deleted org' })).data
    await adminAx.delete('/api/organizations/' + org.id)
    const deleted = await waitForWebhook(r => r.method === 'DELETE' && r.path.endsWith('/identities/organization/' + org.id))
    assert.equal(deleted.secret, 'webhook-secret')
  })
})
