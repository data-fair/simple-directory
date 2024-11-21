const debug = require('debug')('test')
const app = require('../../server/app')
const testUtils = require('../utils')

before('delete emails', async () => {
  await testUtils.deleteAllEmails()
})

before('start app', async function () {
  debug('run app')
  try {
    global.app = await app.run()
  } catch (err) {
    console.error('Failed to run the application', err)
    throw err
  }
  debug('app ok')
})

after('stop app', async () => {
  debug('stop app')
  await Promise.race([
    new Promise(resolve => setTimeout(resolve, 5000)),
    app.stop()
  ])
  debug('stop app ok')
})
