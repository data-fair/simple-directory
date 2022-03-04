process.env.PER_ORG_STORAGE_TYPES = '["ldap"]'

const assert = require('assert').strict
const testUtils = require('./resources/test-utils')
const ldapStorage = require('../server/storages/ldap')

const ldapConfig = JSON.parse(JSON.stringify(require('config').storage.ldap))
ldapConfig.organizations.staticSingleOrg = { id: 'test-ldap', name: 'Test single org' }

// see test/resources/organizations.json to see that the org "test-ldap" has a specific configuration

describe('ldap per org', () => {
  before('prepare ldap directory', async () => {
    const storage = await ldapStorage.init(ldapConfig)

    const user = await storage.getUser({ email: 'alban.mouton@koumoul.com' })
    if (user) await storage.deleteUser(user.id)
    const user2 = await storage.getUser({ email: 'alban.mouton@gmail.com' })
    if (user2) await storage.deleteUser(user2.id)
    await storage.createUser({
      name: 'Alban Mouton',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: [{ id: 'test-ldap', role: 'admin' }]
    })
    await storage.createUser({
      name: 'Alban',
      firstName: 'Alban',
      lastName: '',
      email: 'alban.mouton@gmail.com',
      organizations: [{ id: 'test-ldap', role: 'admin' }]
    })
  })

  after('clean ldap', async () => {
    const storage = await ldapStorage.init(ldapConfig)

    const user = await storage.getUser({ email: 'alban.mouton@koumoul.com' })
    if (user) await storage.deleteUser(user.id)
    const user2 = await storage.getUser({ email: 'alban.mouton@gmail.com' })
    if (user2) await storage.deleteUser(user2.id)
  })

  it('find org members from secondary ldap storage', async () => {
    const ax = await testUtils.axios('dmeadus0@answers.com:testpasswd')
    let res = await ax.get('/api/organizations/test-ldap')
    assert.equal(res.status, 200)
    assert.ok(res.data.orgStorage)
    assert.ok(!res.data.orgStorage.config)
    const adminAx = await testUtils.axios('alban.mouton@koumoul.com:testpasswd:adminMode')
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
