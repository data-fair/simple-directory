const testUtils = require('./resources/test-utils')

const {test} = testUtils.prepare(__filename)

test('Refresh token', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  const res = await ax.post('/api/v1/auth/exchange')
  t.is(res.status, 200)
})
