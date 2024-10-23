import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axiosAuth, clean, startApiServer, stopApiServer } from './utils/index.ts'

process.env.PER_ORG_STORAGE_TYPES = '["ldap"]'
process.env.NODE_CONFIG_DIR = 'api/config/'
const config = (await import('../api/src/config.ts')).default
const ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))
ldapConfig.searchUserDN = 'cn=admin,dc=example,dc=org'
ldapConfig.searchUserPassword = 'admin'
ldapConfig.organizations.staticSingleOrg = { id: 'test-ldap', name: 'Test single org' }

// see test/resources/organizations.json to see that the org "test-ldap" has a specific configuration

describe('ldap storage per organization', () => {
  before(startApiServer)
  beforeEach(async () => await clean({ ldapConfig }))

  // prepare ldap directory
  beforeEach(async () => {
    const ldapStorage = await import('../api/src/storages/ldap.ts')
    const storage = await ldapStorage.init(ldapConfig)

    const user = await storage.getUserByEmail('alban.mouton@koumoul.com')
    if (user) await storage._deleteUser(user.id)
    const user2 = await storage.getUserByEmail('alban.mouton@gmail.com')
    if (user2) await storage._deleteUser(user2.id)
    await storage._createUser({
      id: 'alban',
      name: 'Alban Mouton',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: [{ id: 'test-ldap', role: 'admin', name: 'test ldap' }]
    })
    await storage._createUser({
      id: 'alban2',
      name: 'Alban',
      firstName: 'Alban',
      lastName: '',
      email: 'alban.mouton@gmail.com',
      organizations: [{ id: 'test-ldap', role: 'admin', name: 'test ldap' }]
    })
  })

  after(stopApiServer)

  it('find org members from secondary ldap storage', async () => {
    const ax = await axiosAuth({ email: 'dmeadus0@answers.com', org: 'test-ldap' })
    let res = await ax.get('/api/organizations/test-ldap')
    assert.equal(res.status, 200)
    assert.ok(res.data.orgStorage)
    assert.ok(!res.data.orgStorage.config)
    const adminAx = await axiosAuth({ email: 'alban.mouton@koumoul.com', adminMode: true })
    res = await adminAx.get('/api/organizations/test-ldap')
    assert.equal(res.status, 200)
    assert.ok(res.data.orgStorage)

    res = await ax.get('/api/organizations/test-ldap/members', { params: { org_storage: true } })
    assert.equal(res.status, 200)
    // 1 of the registered was rejected by the extraFilters param
    assert.equal(res.data.count, 1)
    assert.equal(res.data.results[0].email, 'alban.mouton@koumoul.com')
    assert.equal(res.data.results[0].orgStorage, true)
    assert.equal(res.data.results[0].id, 'ldap_test-ldap_Alban Mouton')
  })
})
