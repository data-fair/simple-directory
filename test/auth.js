const testUtils = require('./resources/test-utils')

const [test] = testUtils.prepare(__filename)

test('Refresh token', async t => {
  const ax = await testUtils.axios(__filename, 'dmeadus0@answers.com')
  const res = await ax.post('/api/auth/exchange')
  t.is(res.status, 200)
})
