import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { axiosAuth, clean, startApiServer, stopApiServer } from './utils/index.ts'

process.env.NODE_CONFIG_DIR = './api/config/'
const config = (await import('../api/src/config.ts')).default
const ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))
ldapConfig.organizations.staticSingleOrg = { id: 'test-ldap', name: 'Test single org' }

// see test/resources/organizations.json to see that the org "test-ldap" has a specific configuration

describe('ldap storage per organization in file storage mode', () => {
  before(startApiServer)
  beforeEach(async () => await clean({ ldapConfig }))

  // prepare ldap directory
  beforeEach(async () => {
    const ldapStorage = await import('../api/src/storages/ldap.ts')
    const storage = await ldapStorage.init(ldapConfig)

    await storage._createUser({
      id: 'alban',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: []
    }, { employeeType: 'administrator', departmentNumber: '/prefix/2/dep1' })
    await storage._createUser({
      id: 'alban2',
      firstName: 'Alban',
      lastName: '',
      email: 'alban.mouton@gmail.com',
      organizations: []
    })
  })

  after(stopApiServer)

  it('find org members from secondary ldap storage', async () => {
    const ax = await axiosAuth({ email: 'dmeadus0@answers.com', org: 'test-ldap' })
    let res = await ax.get('/api/organizations/test-ldap')
    assert.equal(res.status, 200)
    assert.ok(res.data.orgStorage)
    assert.ok(!res.data.orgStorage.config)
    const adminAx = await axiosAuth({ email: 'admin@test.com', adminMode: true })
    res = await adminAx.get('/api/organizations/test-ldap')
    assert.equal(res.status, 200)
    assert.ok(res.data.orgStorage)

    res = await ax.get('/api/organizations/test-ldap/members', { params: { org_storage: true } })
    assert.equal(res.status, 200)
    // 1 of the registered was rejected by the extraFilters param
    const member = res.data.results[0]
    assert.equal(res.data.count, 1)
    assert.equal(member.email, 'alban.mouton@koumoul.com')
    assert.equal(member.orgStorage, true)
    assert.equal(member.id, 'ldap_test-ldap_alban')
    assert.equal(member.role, 'admin')
    assert.equal(member.department, 'dep1')

    // TODO: add auth test with user password
  })
})
