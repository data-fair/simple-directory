const ldap = require('ldapjs')
const testUtils = require('./resources/test-utils')

process.env.STORAGE_TYPE = 'ldap'
const { test, config } = testUtils.prepare(__filename)

test.before('clean ldap directory', async t => {
  const user = await test.app.get('storage').getUser({ email: 'alban.mouton@koumoul.com' })
  if (user) await test.app.get('storage').deleteUser(user.id)

  const org = await test.app.get('storage').getOrganization('myorg')
  if (org) await test.app.get('storage').deleteOrganization(org.id)
})

test('create and find users', async t => {
  await test.app.get('storage').createOrganization({
    id: 'myorg',
    name: 'My Org'
  })

  await test.app.get('storage').createUser({
    name: 'Alban Mouton',
    firstName: 'Alban',
    lastName: 'Mouton',
    email: 'alban.mouton@koumoul.com',
    organizations: [{ id: 'myorg' }]
  })
  let res = await test.app.get('storage').findUsers({ skip: 0, size: 10 })
  t.is(res.count, 1)
  t.truthy(res.results[0].id)
  t.truthy(res.results[0].email)
  res = await test.app.get('storage').findUsers({ q: 'alba', skip: 0, size: 10 })
  t.is(res.count, 1)
})
