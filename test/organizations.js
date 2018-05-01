const testUtils = require('./resources/test-utils')

const {test} = testUtils.prepare(__filename)

test('Get organization list when not authenticated', async t => {
  const ax = await testUtils.axios(test)
  const res = await ax.get('/api/v1/organizations')
  t.is(res.status, 200)
  t.is(res.data.count, 0)
})

test('Get organization list when authenticated', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  let res = await ax.get('/api/v1/organizations')
  t.is(res.status, 200)
  t.is(res.data.count, 6)
  res = await ax.get('/api/v1/organizations?is-member=true')
  t.is(res.data.count, 2)
  res = await ax.get('/api/v1/organizations?q=li')
  t.is(res.data.count, 2)
})

test('Get organization roles', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  let res = await ax.get('/api/v1/organizations/3sSi7xDIK/roles')
  t.is(res.status, 200)
  t.is(res.data.length, 2)
})

test('Cannot get organization roles when non member', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  let res = await ax.get('/api/v1/organizations/ihMQiGTaY/roles')
  t.is(res.status, 403)
})
