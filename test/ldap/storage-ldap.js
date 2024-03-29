const assert = require('assert').strict
const ldapStorage = require('../../server/storages/ldap')

const ldapConfig = JSON.parse(JSON.stringify(require('config').storage.ldap))
ldapConfig.members.onlyWithRole = true
ldapConfig.members.role.values = { admin: ['cn=administrator,dc=test', 'cn=superadmin,dc=test'], user: ['cn=users,dc=test'] }
ldapConfig.members.overwrite = [{ email: 'alban.mouton@koumoul.com', role: 'overwritten' }]
ldapConfig.users.overwrite = [{ email: 'alban.mouton@koumoul.com', lastName: 'Overwritten' }]
ldapConfig.organizations.overwrite = [{ id: 'myorg', name: 'Org overwritten' }]

describe('storage ldap', () => {
  before('clean ldap directory', async () => {
    const storage = await ldapStorage.init(ldapConfig)

    const user = storage.getUser({ email: 'alban.mouton@koumoul.com' })
    if (user) await storage._deleteUser(user.id)

    const user2 = storage.getUser({ email: 'test@test.com' })
    if (user2) await storage._deleteUser(user2.id)

    const org = await storage.getOrganization('myorg')
    if (org) await storage._deleteOrganization(org.id)
  })

  it('create and find users', async () => {
    const storage = await ldapStorage.init(ldapConfig)
    await storage._createOrganization({ id: 'myorg', name: 'My Org' })
    await storage._createUser({
      name: 'Alban Mouton',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: [{ id: 'myorg', role: 'admin' }]
    })
    await storage._createUser({
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      organizations: [{ id: 'myorg', role: 'user' }]
    })
    let res = await storage.findUsers({ skip: 0, size: 10, sort: { email: 1 } })
    assert.equal(res.count, 2)
    assert.ok(res.results[0].id)
    assert.equal(res.results[0].email, 'alban.mouton@koumoul.com')
    assert.equal(res.results[0].lastName, 'Overwritten')
    assert.ok(res.results[0].organizations)
    assert.equal(res.results[0].organizations[0].id, 'myorg')
    assert.equal(res.results[0].organizations[0].name, 'Org overwritten')
    res = await storage.findUsers({ q: 'notauser', skip: 0, size: 10 })
    assert.equal(res.count, 0)
    res = await storage.findUsers({ q: 'alba', skip: 0, size: 10 })
    assert.equal(res.count, 1)
    res = await storage.findUsers({ skip: 0, size: 10, sort: { email: -1 } })
    assert.equal(res.count, 2)
    assert.equal(res.results[0].email, 'test@test.com')

    const user = await storage.getUser({ id: res.results[1].id })
    assert.equal(user.email, 'alban.mouton@koumoul.com')
    assert.equal(user.lastName, 'Overwritten')
    assert.equal(user.organizations.length, 1)
    assert.equal(user.organizations[0].id, 'myorg')
    assert.equal(user.organizations[0].name, 'Org overwritten')
    assert.equal(user.organizations[0].role, 'overwritten')

    res = await storage.findMembers('myorg')
    assert.equal(res.count, 2)
    assert.equal(res.results[0].name, 'Alban Mouton')
    assert.equal(res.results[0].role, 'overwritten')

    res = await storage.findMembers('myorg', { q: 'notauser' })
    assert.equal(res.count, 0)
    res = await storage.findMembers('myorg', { q: 'alba' })
    assert.equal(res.count, 1)
    res = await storage.findMembers('myorg', { roles: ['overwritten'] })
    assert.equal(res.count, 1)
    res = await storage.findMembers('myorg', { roles: ['overwritten', 'contrib'] })
    assert.equal(res.count, 1)
    res = await storage.findMembers('myorg', { roles: ['contrib'] })
    assert.equal(res.count, 0)
  })
})
