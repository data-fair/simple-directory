import { start, stop } from './src/server.ts'
import log from '@data-fair/lib-node/log.js'

start().then(() => {}, err => {
  log.error('failure while starting service', { code: 'start-process', err })
  process.exit(1)
})

process.on('SIGTERM', function onSigterm () {
  log.info('Received SIGTERM signal, shutdown gracefully...')
  stop().then(() => {
    log.info('shutting down now')
    process.exit()
  }, err => {
    log.error('failure while stopping service', { code: 'stop-process', err })
    process.exit(1)
  })
})
