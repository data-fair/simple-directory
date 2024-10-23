import { createServer } from 'node:http'
import { session } from '@data-fair/lib-express/index.js'
import { startObserver, stopObserver } from '@data-fair/lib-node/observer.js'
import * as locks from '@data-fair/lib-node/locks.js'
// import upgradeScripts from '@data-fair/lib-node/upgrade-scripts.js'
import mongo from '#mongo'
import * as usersWorker from './users/worker.ts'
import * as keysManager from './tokens/keys-manager.ts'
import * as oauth from './oauth/service.ts'
import * as metrics from './utils/metrics.ts'
import mailsTransport from './mails/transport.ts'
import storages from '#storages'
import { createHttpTerminator } from 'http-terminator'
import app from './app.ts'
import config from '#config'

const server = createServer(app)
const httpTerminator = createHttpTerminator({ server })

// cf https://connectreport.com/blog/tuning-http-keep-alive-in-node-js/
// timeout is often 60s on the reverse proxy, better to a have a longer one here
// so that interruption is managed downstream instead of here
server.keepAliveTimeout = (60 * 1000) + 1000
server.headersTimeout = (60 * 1000) + 2000

export const start = async () => {
  session.init('http://localhost:' + config.port)
  await mongo.init()
  await locks.init(mongo.db)
  await Promise.all([
    oauth.init(),
    storages.init(),
    config.observer.active && startObserver(config.observer.port),
    usersWorker.start(),
    mailsTransport.start(),
    keysManager.start(),
    metrics.init()
  ])
  // await upgradeScripts(mongo.db, resolve(import.meta.dirname, '../..'))

  // TODO: run users planned deletion worker

  server.listen(config.port)
  await new Promise(resolve => server.once('listening', resolve))

  console.log(`API server listening on port ${config.port}`)
}

export const stop = async () => {
  await httpTerminator.terminate()
  await Promise.all([
    config.observer.active && stopObserver(),
    usersWorker.stop(),
    mailsTransport.stop(),
    keysManager.start()
  ])
  await locks.stop()
  await mongo.client.close()
}
