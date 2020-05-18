const testUtils = require('./resources/test-utils')

const { test } = testUtils.prepare(__filename)

test('Find users', async t => {
  let res = await test.app.get('storage').findUsers({ skip: 0, size: 10 })
  t.is(res.count, 12)
  t.truthy(res.results[0].id)
  t.truthy(res.results[0].email)
  res = await test.app.get('storage').findUsers({ q: 'alba', skip: 0, size: 10 })
  t.is(res.count, 1)
})

test('Find members', async t => {
  const res = await test.app.get('storage').findMembers('KWqAGZ4mG', { skip: 0, size: 10 })
  t.is(res.count, 2)
})

test('Get user', async t => {
  let res = await test.app.get('storage').getUser({ id: 'dmeadus0' })
  t.truthy(res)
  t.truthy(res.email)
  t.truthy(res.organizations)
  t.is(res.organizations.length, 2)
  t.is(res.organizations[0].name, 'Fivechat')
  t.is(res.organizations[0].role, 'admin')
})
