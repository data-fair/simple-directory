const debug = require('debug')('test')
const app = require('../../server/app')
const testUtils = require('../utils')

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

beforeEach('scratch data', async () => {
  debug('scratch data')
  await global.app.get('storage').db.collection('organizations').deleteMany({})
  await global.app.get('storage').db.collection('users').deleteMany({})
  await global.app.get('storage').db.collection('sites').deleteMany({})
  global.users = {
    admin: await testUtils.createUser('alban.mouton@koumoul.com', true)
  }
  debug('scratch data ok')
})
