import { strict as assert } from 'node:assert'
import { it, describe, before, beforeEach, after } from 'node:test'
import { clean, startApiServer, stopApiServer } from './utils/index.ts'

process.env.NODE_CONFIG_DIR = './api/config/'
const config = (await import('../api/src/config.ts')).default
const ldapConfig = JSON.parse(JSON.stringify(config.storage.ldap))
ldapConfig.members.overwrite = [
  { email: 'alban.mouton@koumoul.com', role: 'overwritten' },
  { matchAttrs: [{ attr: 'employeeType', values: ['Admin'], captureRegex: '^org1(.*)$' }], orgId: 'org1', orgOnly: true, role: 'admin' }
]
ldapConfig.users.overwrite = [{ email: 'alban.mouton@koumoul.com', lastName: 'Overwritten' }]
ldapConfig.organizations.overwrite = [{ id: 'myorg', name: 'Org overwritten' }]

// see test/resources/organizations.json to see that the org "test-ldap" has a specific configuration

describe('storage ldap', () => {
  before(startApiServer)
  beforeEach(async () => await clean({ ldapConfig }))
  after(stopApiServer)

  it('create and find users', async () => {
    const ldapStorage = await import('../api/src/storages/ldap.ts')
    const storage = await ldapStorage.init(ldapConfig)
    await storage._createOrganization({ id: 'MyOrg', name: 'My Org' })
    await storage._createOrganization({ id: 'org1', name: 'Org 1' })
    await storage._createUser({
      id: 'alban1',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: [{ id: 'MyOrg', role: 'admin', name: 'my org' }]
    })
    await storage._createUser({
      id: 'test1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      organizations: [{ id: 'MyOrg', role: 'user', name: 'my org' }]
    }, { departmentNumber: '/prefix/2/dep1', employeeType: ['administrator', 'employee'] })
    await storage._createUser({
      id: 'adminorg1',
      firstName: 'Test in admin org',
      lastName: 'User',
      email: 'test2@test.com',
      organizations: [{ id: 'MyOrg', role: 'user', name: 'my org' }]
    }, { employeeType: 'org1Admin' })
    const users = await storage.findUsers({ skip: 0, size: 10, sort: { email: 1 } })
    assert.equal(users.count, 3)
    assert.ok(users.results[0].id)
    assert.equal(users.results[0].email, 'alban.mouton@koumoul.com')
    assert.equal(users.results[0].lastName, 'Overwritten')
    assert.ok(users.results[0].organizations)
    assert.equal(users.results[0].organizations[0].id, 'myorg')
    assert.equal(users.results[0].organizations[0].name, 'Org overwritten')
    const users2 = await storage.findUsers({ q: 'notauser', skip: 0, size: 10 })
    assert.equal(users2.count, 0)
    const users3 = await storage.findUsers({ q: 'alba', skip: 0, size: 10 })
    assert.equal(users3.count, 1)
    const users4 = await storage.findUsers({ skip: 0, size: 10, sort: { email: -1 } })
    assert.equal(users4.count, 3)
    assert.equal(users4.results[0].email, 'test@test.com')

    const user = await storage.getUser(users4.results[2].id)
    assert.ok(user)
    assert.equal(user.email, 'alban.mouton@koumoul.com')
    assert.equal(user.lastName, 'Overwritten')
    assert.equal(user.organizations.length, 1)
    assert.equal(user.organizations[0].id, 'myorg')
    assert.equal(user.organizations[0].name, 'Org overwritten')
    assert.equal(user.organizations[0].role, 'overwritten')

    const members = await storage.findMembers('myorg', { skip: 0, size: 10 })
    assert.equal(members.count, 2)
    assert.equal(members.results[0].name, 'Alban Overwritten')
    assert.equal(members.results[0].role, 'overwritten')
    assert.equal(members.results[0].department, undefined)
    assert.equal(members.results[1].name, 'Test User')
    assert.equal(members.results[1].role, 'admin')
    assert.equal(members.results[1].department, 'dep1')

    const org1Members = await storage.findMembers('org1', { skip: 0, size: 10 })
    assert.equal(org1Members.count, 1)
    assert.equal(org1Members.results[0].id, 'adminorg1')
    assert.equal(org1Members.results[0].role, 'admin')

    const members2 = await storage.findMembers('myorg', { q: 'notauser', skip: 0, size: 10 })
    assert.equal(members2.count, 0)
    const member3 = await storage.findMembers('myorg', { q: 'alba', skip: 0, size: 10 })
    assert.equal(member3.count, 1)
    const members4 = await storage.findMembers('myorg', { roles: ['overwritten'], skip: 0, size: 10 })
    assert.equal(members4.count, 1)
    const member5 = await storage.findMembers('myorg', { roles: ['overwritten', 'contrib'], skip: 0, size: 10 })
    assert.equal(member5.count, 1)
    const members6 = await storage.findMembers('myorg', { roles: ['contrib'], skip: 0, size: 10 })
    assert.equal(members6.count, 0)

    const org = await storage.getOrganization('myorg')
    assert.equal(org.id, 'myorg')
    assert.equal(org.name, 'Org overwritten')
    assert.deepEqual(org.departments, [{ id: 'dep1', name: 'dep1' }])
    await storage.getOrganization('myorg')
    await storage.getOrganization('myorg')

    const orgs = await storage.findOrganizations({ skip: 0, size: 10, sort: { name: -1 } })
    assert.equal(orgs.count, 3)
    assert.equal(orgs.results[0].id, 'myorg')
    assert.equal(orgs.results[0].name, 'Org overwritten')

    // mode MULTI_ROLES
    config.multiRoles = true
    storage.clearCache()
    const members7 = await storage.findMembers('myorg', { skip: 0, size: 10 })
    assert.equal(members7.count, 3)
    assert.ok(members7.results.find(m => m.id === 'test1' && m.role === 'admin'))
    assert.ok(members7.results.find(m => m.id === 'test1' && m.role === 'user'))

    // role overwritten in db and read both with or without cache
    config.multiRoles = false
    config.storage.ldap.cacheMS = 10000
    storage.clearCache()
    await storage.patchMember('myorg', 'test1', null, null, { role: 'contrib2' })
    const members8 = await storage.findMembers('myorg', { skip: 0, size: 10 })
    assert.ok(!members8.fromCache)
    assert.equal(members8.results[1].role, 'contrib2')
    const members9 = await storage.findMembers('myorg', { skip: 0, size: 10 })
    assert.ok(members9.fromCache)
    assert.equal(members9.results[1].role, 'contrib2')
    await storage.patchMember('myorg', 'test1', null, null, { role: 'contrib3' })
    const members10 = await storage.findMembers('myorg', { skip: 0, size: 10 })
    assert.ok(!members10.fromCache)
    assert.equal(members10.results[1].role, 'contrib3')
    config.storage.ldap.cacheMS = 0
  })
})
