process.env.STORAGE_TYPE = 'mongo'

const debug = require('debug')('test')
const app = require('../../server/app')

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
  try {
    await Promise.all([
      global.app.get('storage').db.collection('users').deleteMany({}),
      global.app.get('storage').db.collection('organizations').deleteMany({})
    ])
  } catch (err) {
    console.warn('error while scratching data before test', err)
  }
  debug('scratch data ok')
})
