process.env.PER_ORG_STORAGE_TYPES = '["ldap"]'

const testUtils = require('./resources/test-utils')
const ldapStorage = require('../server/storages/ldap')
const { test, config } = testUtils.prepare(__filename)

const ldapConfig = config.storage.ldap

// see test/resources/organizations.json to see that the org "test-ldap" has a specific configuration

test.before('clean ldap directory', async t => {
  const storage = await ldapStorage.init(ldapConfig)

  const user = await storage.getUser({ email: 'alban.mouton@koumoul.com' })
  if (user) await storage.deleteUser(user.id)

  // const org = await storage.getOrganization('test-org')
  // if (org) await storage.deleteOrganization(org.id)

  // await storage.createOrganization({ id: 'ldap-org', name: 'My Org' })

  await storage.createUser({
    name: 'Alban Mouton',
    firstName: 'Alban',
    lastName: 'Mouton',
    email: 'alban.mouton@koumoul.com',
    organizations: [{ id: 'test-org', role: 'admin' }],
  })
})

test('find org members from secondary ldap storage', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com:testpasswd')
  let res = await ax.get('/api/organizations/test-ldap')
  t.is(res.status, 200)
  t.falsy(res.data.orgStorage)
  const adminAx = await testUtils.axios(test, 'alban.mouton@koumoul.com:testpasswd:adminMode')
  res = await adminAx.get('/api/organizations/test-ldap')
  t.is(res.status, 200)
  t.truthy(res.data.orgStorage)

  res = await ax.get('/api/organizations/test-ldap/members')
  t.is(res.status, 200)
  t.is(res.data.count, 2)
  t.is(res.data.results[1].email, 'alban.mouton@koumoul.com')
  t.is(res.data.results[1].orgStorage, true)
  t.is(res.data.results[1].id, 'ldap_test-ldap_Alban Mouton')
})
