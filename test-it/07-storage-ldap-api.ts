import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axios, axiosAuth, clean, startApiServer, stopApiServer } from './utils/index.ts'

process.env.STORAGE_TYPE = 'ldap'
process.env.NODE_CONFIG_DIR = 'api/config/'
const config = (await import('../api/src/config.ts')).default
const ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))

describe('ldap storage API', () => {
  before(startApiServer)
  beforeEach(async () => await clean({ ldapConfig }))

  // prepare ldap directory
  beforeEach(async () => {
    const ldapStorage = await import('../api/src/storages/ldap.ts')
    const storage = await ldapStorage.init(ldapConfig)
    await storage._createOrganization({ id: 'myorg', name: 'My Org' })
    await storage._createUser({
      id: 'alban',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: [{ id: 'myorg', role: 'user', name: 'my org' }],
      password: 'passwd'
    })
  })

  after(stopApiServer)

  it('Get organization list when authenticated with api key', async () => {
    const ax = await axios()
    const res = await ax.get('/api/organizations?apiKey=testkey')
    assert.equal(res.status, 200)
    assert.equal(res.data.count, 2)
    assert.ok(res.data.results.find((o: any) => o.id === 'example'))
    assert.ok(res.data.results.find((o: any) => o.id === 'myorg'))
  })

  it('Login with a ldap user', async () => {
    const ax = await axiosAuth({ email: 'alban.mouton@koumoul.com' })
    const res = await ax.get('/api/auth/me')
    assert.equal(res.status, 200)
    assert.equal(res.data.id, 'alban')
    assert.equal(res.data.organizations?.[0].id, 'myorg')
  })
})
