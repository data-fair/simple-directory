import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { axios, axiosAuth, clean, startApiServer, stopApiServer } from '../support/in-process-server.ts'

let ldapConfig: any

test.describe('ldap storage API', () => {
  test.beforeAll(async () => {
    process.env.STORAGE_TYPE = 'ldap'
    await startApiServer()
    const config = (await import('../../api/src/config.ts')).default
    ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))
    delete ldapConfig.organizations?.staticSingleOrg
    ldapConfig.cacheMS = 0
  })
  test.beforeEach(async () => await clean({ ldapConfig }))

  // prepare ldap directory
  test.beforeEach(async () => {
    const ldapStorage = await import('../../api/src/storages/ldap.ts')
    const storage = await ldapStorage.init(ldapConfig)
    await storage._createOrganization({ id: 'myorg', name: 'My Org' })
    await storage._createUser({
      id: 'alban',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: [{ id: 'myorg', role: 'user', name: 'my org' }],
      password: 'TestPasswd01'
    })
  })

  test.afterAll(stopApiServer)

  test('Get organization list when authenticated with api key', async () => {
    const ax = await axios()
    const res = await ax.get('/api/organizations?apiKey=testkey')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 2)
    assert.ok(res.data.results.find((o: any) => o.id === 'example'))
    assert.ok(res.data.results.find((o: any) => o.id === 'myorg'))
  })

  test('Login with a ldap user', async () => {
    const ax = await axiosAuth({ email: 'alban.mouton@koumoul.com' })
    const res = await ax.get('/api/auth/me')
    assert.equal(res.status, 200)
    assert.equal(res.data.id, 'alban')
    assert.equal(res.data.organizations?.[0].id, 'myorg')
  })
})
