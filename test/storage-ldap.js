const ldap = require('ldapjs')
const testUtils = require('./resources/test-utils')

process.env.STORAGE_TYPE = 'ldap'
const { test, config } = testUtils.prepare(__filename)

test.before('clean ldap directory', async t => {
  // TODO
})

test('Find users', async t => {
  let res = await test.app.get('storage').findUsers({ skip: 0, size: 10 })
  console.log(res.results)
  t.is(res.count, 12)
  t.truthy(res.results[0].id)
  t.truthy(res.results[0].email)
  res = await test.app.get('storage').findUsers({ q: 'alba', skip: 0, size: 10 })
  t.is(res.count, 1)
})
