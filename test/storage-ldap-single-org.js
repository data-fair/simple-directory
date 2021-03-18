const testUtils = require('./resources/test-utils')

process.env.STORAGE_TYPE = 'ldap'
process.env.STORAGE_LDAP_ORGS_STATIC_SINGLE_ORG = '{"id": "test-single-org", "name": "Test single org"}'
process.env.STORAGE_LDAP_MEMBERS_ROLE_VALUES = JSON.stringify({ admin: ['administrator'], user: [] })
const { test } = testUtils.prepare(__filename)

test.before('clean ldap directory', async t => {
  const user = await test.app.get('storage').getUser({ email: 'alban.mouton@koumoul.com' })
  if (user) await test.app.get('storage').deleteUser(user.id)

  const org = await test.app.get('storage').getOrganization('myorg')
  if (org) await test.app.get('storage').deleteOrganization(org.id)
})

test('create and find users in static single org', async t => {
  const storage = test.app.get('storage')
  await storage.createUser({
    name: 'Alban Mouton',
    firstName: 'Alban',
    lastName: 'Mouton',
    email: 'alban.mouton@koumoul.com',
    organizations: [{ id: 'test-single-org', role: 'admin' }]
  })
  let res = await storage.findUsers({ skip: 0, size: 10 })
  t.is(res.count, 1)
  t.truthy(res.results[0].id)
  t.truthy(res.results[0].email)
  res = await storage.findUsers({ q: 'notauser', skip: 0, size: 10 })
  t.is(res.count, 0)
  res = await storage.findUsers({ q: 'alba', skip: 0, size: 10 })
  t.is(res.count, 1)

  const user = await storage.getUser({ id: res.results[0].id })
  t.is(user.organizations.length, 1)
  t.is(user.organizations[0].id, 'test-single-org')
  t.is(user.organizations[0].name, 'Test single org')
  t.is(user.organizations[0].role, 'admin')

  res = await storage.findMembers('test-single-org')
  t.is(res.count, 1)
  t.is(res.results[0].name, 'Alban Mouton')
  t.is(res.results[0].role, 'admin')

  res = await storage.findMembers('test-single-org', { q: 'notauser' })
  t.is(res.count, 0)
  res = await storage.findMembers('test-single-org', { q: 'alba' })
  t.is(res.count, 1)
})
