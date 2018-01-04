const testUtils = require('./resources/test-utils')

const [test] = testUtils.prepare(__filename)

test('Get organization list when not authenticated', async t => {
  const ax = await testUtils.axios(__filename)
  const res = await ax.get('/api/organizations')
  t.is(res.status, 200)
  t.is(res.data.count, 0)
})

test('Get organization list when authenticated', async t => {
  const ax = await testUtils.axios(__filename, 'dmeadus0@answers.com')
  let res = await ax.get('/api/organizations')
  t.is(res.status, 200)
  t.is(res.data.count, 6)
  res = await ax.get('/api/organizations?is-member=true')
  t.is(res.data.count, 2)
})
