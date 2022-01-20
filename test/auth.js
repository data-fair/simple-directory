const testUtils = require('./resources/test-utils')

const { test } = testUtils.prepare(__filename)

test('Create session for known user', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com:testpasswd')
  const res = await ax.get('/api/auth/me')
  t.is(res.status, 200)
  t.is(res.data.email, 'dmeadus0@answers.com')
})

test('Create session for known user, insensitive to email case', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com:testpasswd')
  const res = await ax.get('/api/auth/me')
  t.is(res.status, 200)
  t.is(res.data.email, 'dmeadus0@answers.com')
})

test('Do not create session for unknown user', async t => {
  try {
    await testUtils.axios(test, 'notauser@test.com')
    t.fail()
  } catch (err) {
    t.pass()
  }
})

test('Refresh token', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com:testpasswd')
  let res = await ax.post('/api/auth/keepalive')
  t.is(res.status, 204)
  t.true(res.headers['set-cookie'][0].startsWith('id_token='))
  t.true(res.headers['set-cookie'][1].startsWith('id_token_sign='))

  // same thing using retrocompatibility route
  res = await ax.post('/api/session/keepalive')
  t.is(res.status, 204)
  t.true(res.headers['set-cookie'][0].startsWith('id_token='))
  t.true(res.headers['set-cookie'][1].startsWith('id_token_sign='))
})
