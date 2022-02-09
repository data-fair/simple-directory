process.env.PER_ORG_STORAGE_TYPES = '["ldap"]'
process.env.STORAGE_LDAP_ORGS_STATIC_SINGLE_ORG = '{"id": "test-ldap", "name": "Test single org"}'

const testUtils = require('./resources/test-utils')
const ldapStorage = require('../server/storages/ldap')

const { test, config } = testUtils.prepare(__filename)

const ldapConfig = config.storage.ldap

// see test/resources/organizations.json to see that the org "test-ldap" has a specific configuration

test.before('prepare ldap directory', async t => {
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
    organizations: [{ id: 'test-ldap', role: 'admin' }],
  })

  await storage.createUser({
    name: 'Alban',
    firstName: 'Alban',
    lastName: '',
    email: 'alban.mouton@gmail.com',
    organizations: [{ id: 'test-ldap', role: 'admin' }],
  })
})

test.after('clean ldap', async () => {
  const storage = await ldapStorage.init(ldapConfig)

  const user = await storage.getUser({ email: 'alban.mouton@koumoul.com' })
  if (user) await storage.deleteUser(user.id)
  const user2 = await storage.getUser({ email: 'alban.mouton@gmail.com' })
  if (user2) await storage.deleteUser(user2.id)
})

test('find org members from secondary ldap storage', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com:testpasswd')
  let res = await ax.get('/api/organizations/test-ldap')
  t.is(res.status, 200)
  t.truthy(res.data.orgStorage)
  t.falsy(res.data.orgStorage.config)
  const adminAx = await testUtils.axios(test, 'alban.mouton@koumoul.com:testpasswd:adminMode')
  res = await adminAx.get('/api/organizations/test-ldap')
  t.is(res.status, 200)
  t.truthy(res.data.orgStorage)

  res = await ax.get('/api/organizations/test-ldap/members', { params: { org_storage: true } })
  t.is(res.status, 200)
  // 1 of the registered was rejected by the extraFilters param
  t.is(res.data.count, 1)
  t.is(res.data.results[0].email, 'alban.mouton@koumoul.com')
  t.is(res.data.results[0].orgStorage, true)
  t.is(res.data.results[0].id, 'ldap_test-ldap_Alban Mouton')
})
