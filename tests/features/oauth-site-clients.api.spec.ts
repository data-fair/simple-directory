import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { MongoClient } from 'mongodb'
import { axios, createUser, testEnvAx, getServerConfig } from '../support/axios.ts'
import { grantDoc } from '../support/oauth-code-site.ts'

const siteHost = `127.0.0.1:${process.env.NGINX_PORT2}`
const siteId = 'test_oauth_clients_site'

const clientBody = (extra: Record<string, any> = {}) => ({
  name: 'Dash',
  redirectUris: ['https://dash.example.org/cb'],
  scopes: ['organizations:read'],
  consent: 'explicit',
  ...extra
})

const setup = async () => {
  const config = await getServerConfig()
  const { ax } = await createUser('oauth-clients-owner@test.com')
  const org = (await ax.post('/api/organizations', { name: 'OAuth clients org' })).data
  await axios().post('/api/sites',
    { _id: siteId, owner: { type: 'organization', id: org.id, name: org.name }, host: siteHost },
    { params: { key: config.secretKeys.sites } })
  const { ax: adminAx } = await createUser('admin@test.com', true)
  await adminAx.patch('/api/sites/' + siteId, { isAccountMain: true })
  await testEnvAx.post('/clear-site-cache')
  return { adminAx, config }
}

test.describe('oauth site clients api', () => {
  test.beforeEach(async () => {
    await testEnvAx.delete('/')
  })

  test('superadmin saves site clients and ids are generated', async () => {
    const { adminAx } = await setup()
    await adminAx.patch('/api/sites/' + siteId, { oauthClients: [clientBody()] })
    const site = (await adminAx.get('/api/sites/' + siteId, { params: { showAll: true } })).data
    assert.equal(site.oauthClients.length, 1)
    const id = site.oauthClients[0].id
    assert.match(id, /^site-/)
    // a round trip of the whole list keeps the id
    await adminAx.patch('/api/sites/' + siteId, { oauthClients: [{ ...clientBody(), id, name: 'Dash 2' }] })
    const site2 = (await adminAx.get('/api/sites/' + siteId, { params: { showAll: true } })).data
    assert.equal(site2.oauthClients[0].id, id)
    assert.equal(site2.oauthClients[0].name, 'Dash 2')
    // an id that was never on this site is refused
    await assert.rejects(adminAx.patch('/api/sites/' + siteId, { oauthClients: [{ ...clientBody(), id: 'site-other' }] }), (err: any) => err.status === 400)
  })

  test('an http non-loopback redirect uri is refused', async () => {
    const { adminAx } = await setup()
    await assert.rejects(adminAx.patch('/api/sites/' + siteId, { oauthClients: [clientBody({ redirectUris: ['http://dash.example.org/cb'] })] }), (err: any) => err.status === 400)
    await assert.rejects(adminAx.patch('/api/sites/' + siteId, { oauthClients: [clientBody({ redirectUris: ['https://dash.example.org/cb#x'] })] }), (err: any) => err.status === 400)
    await adminAx.patch('/api/sites/' + siteId, { oauthClients: [clientBody({ redirectUris: ['http://localhost:5173/cb'] })] })
  })

  test('removing a site client revokes its grants', async () => {
    const { adminAx, config } = await setup()
    await adminAx.patch('/api/sites/' + siteId, { oauthClients: [clientBody(), clientBody({ name: 'Other' })] })
    const clients = (await adminAx.get('/api/sites/' + siteId, { params: { showAll: true } })).data.oauthClients
    const record = (id: string, clientId: string) => ({
      _id: id,
      issuer: 'http://' + siteHost + '/simple-directory',
      siteId,
      clientId,
      clientName: 'Dash',
      clientKind: 'site',
      subject: { type: 'user', id: 'test_u1' },
      account: { type: 'user', id: 'test_u1' },
      scope: 'organizations:read',
      resources: [],
      authorizedBy: { id: 'test_u1', name: 'U1' },
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60000)
    })
    const mongoClient = await MongoClient.connect(config.mongo.url)
    try {
      const grants = mongoClient.db().collection<any>('oauth-grant')
      await grants.insertMany([grantDoc(record('test_g1', clients[0].id)), grantDoc(record('test_g2', clients[1].id))])
      await adminAx.patch('/api/sites/' + siteId, { oauthClients: [clients[1]] })
      assert.equal(await grants.countDocuments({ _id: 'test_g1' }), 0)
      assert.equal(await grants.countDocuments({ _id: 'test_g2' }), 1)
      await adminAx.patch('/api/sites/' + siteId, { oauthClients: [] })
      assert.equal(await grants.countDocuments({ _id: 'test_g2' }), 0)
    } finally {
      await mongoClient.db().collection<any>('oauth-grant').deleteMany({ _id: /^test_g/ })
      await mongoClient.close()
    }
  })

  test('invalid allowed origins and unknown scopes are refused', async () => {
    const { adminAx } = await setup()
    for (const allowedOrigins of [['https://'], ['http://dash.example.org'], ['https://dash.example.org/path']]) {
      await assert.rejects(adminAx.patch('/api/sites/' + siteId, { oauthClients: [clientBody({ allowedOrigins })] }), (err: any) => err.status === 400, JSON.stringify(allowedOrigins))
    }
    await assert.rejects(adminAx.patch('/api/sites/' + siteId, { oauthClients: [clientBody({ scopes: ['nothing:known'] })] }), (err: any) => err.status === 400)
    await adminAx.patch('/api/sites/' + siteId, { oauthClients: [clientBody({ allowedOrigins: ['https://dash.example.org'] })] })
  })

  test('deleting a site revokes the grants of its clients', async () => {
    const { adminAx, config } = await setup()
    await adminAx.patch('/api/sites/' + siteId, { oauthClients: [clientBody()] })
    const clientId = (await adminAx.get('/api/sites/' + siteId, { params: { showAll: true } })).data.oauthClients[0].id
    const mongoClient = await MongoClient.connect(config.mongo.url)
    try {
      const grants = mongoClient.db().collection<any>('oauth-grant')
      await grants.insertOne(grantDoc({
        _id: 'test_g_del',
        issuer: 'http://' + siteHost + '/simple-directory',
        siteId,
        clientId,
        clientName: 'Dash',
        clientKind: 'site',
        subject: { type: 'user', id: 'test_u1' },
        account: { type: 'user', id: 'test_u1' },
        scope: 'organizations:read',
        resources: [],
        authorizedBy: { id: 'test_u1', name: 'U1' },
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000)
      }))
      await adminAx.delete('/api/sites/' + siteId)
      assert.equal(await grants.countDocuments({ _id: 'test_g_del' }), 0)
    } finally {
      await mongoClient.db().collection<any>('oauth-grant').deleteMany({ _id: /^test_g/ })
      await mongoClient.close()
    }
  })
})
