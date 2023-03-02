const config = require('config')
const app = require('./app')

app.run().then(() => {
  console.log(`Listening on localhost:${config.port}, exposed on ${config.publicUrl}`)
}, err => {
  console.error('failed to run application', err)
  process.exit(-1)
})

process.on('SIGTERM', function onSigterm () {
  console.info('Received SIGTERM signal, shutdown gracefully...')
  app.stop().then(() => {
    console.log('shutting down now')
    process.exit()
  }, err => {
    console.error('failed to stop application cleanly', err)
    process.exit(-1)
  })
})
