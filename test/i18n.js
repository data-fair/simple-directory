const testUtils = require('./resources/test-utils')

const { test } = testUtils.prepare(__filename)

test('Error message with default lang if not specified', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  let res = await ax.get('/api/organizations/ihMQiGTaY/roles')
  t.is(res.data, 'Permissions insuffisantes.')
})

test('Error message with default lang if unknown specified', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  let res = await ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'ff-FF' } })
  t.is(res.data, 'Permissions insuffisantes.')
})

test('Error message with specified lang', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  let res = await ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'en-EN' } })
  t.is(res.data, 'Insufficient permissions.')
})

test('Error message with another specified lang', async t => {
  const ax = await testUtils.axios(test, 'dmeadus0@answers.com')
  let res = await ax.get('/api/organizations/ihMQiGTaY/roles', { headers: { 'Accept-Language': 'es-ES' } })
  t.is(res.data, 'Permisos insuficientes.')
})
