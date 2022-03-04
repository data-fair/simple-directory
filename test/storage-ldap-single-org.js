const assert = require('assert').strict
const ldapStorage = require('../server/storages/ldap')

const ldapConfig = JSON.parse(JSON.stringify(require('config').storage.ldap))
ldapConfig.organizations.staticSingleOrg = { id: 'test-single-org', name: 'Test single org' }
ldapConfig.members.role.values = { admin: ['administrator'], user: [] }

describe('ldap single org', () => {
  before('clean ldap directory', async () => {
    const storage = await ldapStorage.init(ldapConfig)

    const user = storage.getUser({ email: 'alban.mouton@koumoul.com' })
    if (user) storage.deleteUser(user.id)

    const org = storage.getOrganization('myorg')
    if (org) storage.deleteOrganization(org.id)
  })

  it('create and find users in static single org', async () => {
    const storage = await ldapStorage.init(ldapConfig)

    await storage.createUser({
      name: 'Alban Mouton',
      firstName: 'Alban',
      lastName: 'Mouton',
      email: 'alban.mouton@koumoul.com',
      organizations: [{ id: 'test-single-org', role: 'admin' }]
    })
    let res = await storage.findUsers({ skip: 0, size: 10 })
    assert.equal(res.count, 1)
    assert.ok(res.results[0].id)
    assert.ok(res.results[0].email)
    res = await storage.findUsers({ q: 'notauser', skip: 0, size: 10 })
    assert.equal(res.count, 0)
    res = await storage.findUsers({ q: 'alba', skip: 0, size: 10 })
    assert.equal(res.count, 1)

    const user = await storage.getUser({ id: res.results[0].id })
    assert.equal(user.organizations.length, 1)
    assert.equal(user.organizations[0].id, 'test-single-org')
    assert.equal(user.organizations[0].name, 'Test single org')
    assert.equal(user.organizations[0].role, 'admin')

    res = await storage.findMembers('test-single-org')
    assert.equal(res.count, 1)
    assert.equal(res.results[0].name, 'Alban Mouton')
    assert.equal(res.results[0].role, 'admin')

    res = await storage.findMembers('test-single-org', { q: 'notauser' })
    assert.equal(res.count, 0)
    res = await storage.findMembers('test-single-org', { q: 'alba' })
    assert.equal(res.count, 1)
  })
})
