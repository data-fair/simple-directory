const config = require('config')
const app = require('./app')

app.run().then(() => {
  console.log('Listening on http://localhost:%s', config.port)
}, err => { throw err })

process.on('SIGTERM', function onSigterm () {
  console.info('Received SIGTERM signal, shutdown gracefully...')
  app.stop().then(() => process.exit(), error => { throw error })
})
