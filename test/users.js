const testUtils = require('./resources/test-utils')

const {test} = testUtils.prepare(__filename)

test('Get user list when not authenticated', async t => {
  const ax = await testUtils.axios(test)
  const res = await ax.get('/api/users')
  t.is(res.status, 200)
  t.is(res.data.count, 0)
})

test('Get user list when authenticated', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  const res = await ax.get('/api/users')
  t.is(res.status, 200)
  t.is(res.data.count, 11)
})

test('Get filter user list when authenticated', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  const res = await ax.get('/api/users?q=Al')
  t.is(res.status, 200)
  t.is(res.data.count, 3)
})

test('Get user info when not authenticated', async t => {
  const ax = await testUtils.axios(test)
  const res = await ax.get('/api/users/ccherryholme1')
  t.is(res.status, 401)
})

test('Get user info when authenticated as another user', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  const res = await ax.get('/api/users/ccherryholme1')
  t.is(res.status, 403)
})

test('Get user infos', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  const res = await ax.get('/api/users/dmeadus0')
  t.is(res.status, 200)
  t.is(res.data.email, 'dmeadus0@answers.com')
})
