const testUtils = require('./resources/test-utils')

const { test } = testUtils.prepare(__filename)

test('Get organization list when not authenticated', async t => {
  const ax = await testUtils.axios(test)
  const res = await ax.get('/api/organizations')
  t.is(res.status, 200)
  t.is(res.data.count, 0)
})

test('Get organization list when authenticated', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com:testpasswd')
  let res = await ax.get('/api/organizations')
  t.is(res.status, 200)
  t.is(res.data.count, 7)
  res = await ax.get('/api/organizations?q=li')
  t.is(res.data.count, 2)
})

test('Get organization list when authenticated with api key', async t => {
  const ax = await testUtils.axios(test)
  const res = await ax.get('/api/organizations?apiKey=testkey')
  t.is(res.status, 200)
  t.is(res.data.count, 7)
})

test('Get organization roles', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com:testpasswd')
  const res = await ax.get('/api/organizations/3sSi7xDIK/roles')
  t.is(res.status, 200)
  t.is(res.data.length, 2)
})

test('Cannot get organization roles when non member', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com:testpasswd')
  const res = await ax.get('/api/organizations/ihMQiGTaY/roles')
  t.is(res.status, 403)
})
