const testUtils = require('./resources/test-utils')

process.env.STORAGE_TYPE = 'ldap'
process.env.STORAGE_LDAP_ONLY_WITH_ROLE = 'true'
process.env.STORAGE_LDAP_MEMBERS_ROLE_VALUES = JSON.stringify({ admin: ['cn=administrator,dc=test', 'cn=superadmin,dc=test'], user: ['cn=users,dc=test'] })
const { test } = testUtils.prepare(__filename)

test.before('clean ldap directory', async t => {
  const user = await test.app.get('storage').getUser({ email: 'alban.mouton@koumoul.com' })
  if (user) await test.app.get('storage').deleteUser(user.id)

  const org = await test.app.get('storage').getOrganization('myorg')
  if (org) await test.app.get('storage').deleteOrganization(org.id)
})

test('create and find users', async t => {
  const storage = test.app.get('storage')
  await storage.createOrganization({ id: 'myorg', name: 'My Org' })
  await storage.createUser({
    name: 'Alban Mouton',
    firstName: 'Alban',
    lastName: 'Mouton',
    email: 'alban.mouton@koumoul.com',
    organizations: [{ id: 'myorg', role: 'admin' }]
  })
  let res = await storage.findUsers({ skip: 0, size: 10 })
  t.is(res.count, 1)
  t.truthy(res.results[0].id)
  t.is(res.results[0].email, 'alban.mouton@koumoul.com')
  t.truthy(res.results[0].organizations)
  t.is(res.results[0].organizations[0].id, 'myorg')
  res = await storage.findUsers({ q: 'notauser', skip: 0, size: 10 })
  t.is(res.count, 0)
  res = await storage.findUsers({ q: 'alba', skip: 0, size: 10 })
  t.is(res.count, 1)

  const user = await storage.getUser({ id: res.results[0].id })
  t.is(user.organizations.length, 1)
  t.is(user.organizations[0].id, 'myorg')
  t.is(user.organizations[0].name, 'My Org')
  t.is(user.organizations[0].role, 'admin')

  res = await storage.findMembers('myorg')
  t.is(res.count, 1)
  t.is(res.results[0].name, 'Alban Mouton')
  t.is(res.results[0].role, 'admin')

  res = await storage.findMembers('myorg', { q: 'notauser' })
  t.is(res.count, 0)
  res = await storage.findMembers('myorg', { q: 'alba' })
  t.is(res.count, 1)
  res = await storage.findMembers('myorg', { roles: ['admin'] })
  t.is(res.count, 1)
  res = await storage.findMembers('myorg', { roles: ['admin', 'contrib'] })
  t.is(res.count, 1)
  res = await storage.findMembers('myorg', { roles: ['contrib'] })
  t.is(res.count, 0)
})
