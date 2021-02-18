const MongoClient = require('mongodb').MongoClient
const testUtils = require('./resources/test-utils')

process.env.STORAGE_TYPE = 'mongo'
const { test, config } = testUtils.prepare(__filename)

test.before('clean db', async t => {
  const client = await MongoClient.connect(config.storage.mongo.url)
  const db = client.db()
  await db.dropDatabase()
})

test('Find users', async t => {
  t.pass()
})

test('Get user', async t => {
  t.pass()
})
