const testUtils = require('./resources/test-utils')

process.env.STORAGE_TYPE = 'mongo'
const { test } = testUtils.prepare(__filename)

test('Find users', async t => {
  t.pass()
})

test('Get user', async t => {
  t.pass()
})
