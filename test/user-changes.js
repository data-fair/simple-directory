const eventToPromise = require('event-to-promise')

const testUtils = require('./resources/test-utils')

process.env.STORAGE_TYPE = 'mongo'
const { test } = testUtils.prepare(__filename)

const mails = require('../server/mails')

test('Create a user', async t => {
  const adminAx = await testUtils.axios(test, 'alban.mouton@koumoul.com')
  let res = await adminAx.get('/api/users')
  t.is(res.data.count, 1) // only the super admin at first

  const ax = await testUtils.axios(test)
  res = await ax.post('/api/users', {})
  t.is(res.status, 400)
  const mailPromise = eventToPromise(mails.events, 'send')
  res = await ax.post('/api/users', { email: 'user1@test.com' })
  t.is(res.status, 204)
  res = await adminAx.get('/api/users')
  t.is(res.data.count, 2)

  // received a mail with a link to validate email address
  const mail = await mailPromise
  const idToken = new URL(mail.link).searchParams.get('id_token')
  t.truthy(idToken)
  res = await ax.post('/api/auth/exchange', null, { params: { id_token: idToken } })
  const sessionToken = res.data
  t.truthy(sessionToken)
  res = await ax.post('/api/auth/exchange', null, { params: { id_token: sessionToken } })
  const sessionToken2 = res.data
  t.truthy(sessionToken2)
})
