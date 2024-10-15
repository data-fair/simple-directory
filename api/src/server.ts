import { createServer } from 'node:http'
import { resolve } from 'node:path'
import i18n from 'i18n'
import { session } from '@data-fair/lib-express/index.js'
import { startObserver, stopObserver } from '@data-fair/lib-node/observer.js'
import * as locks from '@data-fair/lib-node/locks.js'
// import upgradeScripts from '@data-fair/lib-node/upgrade-scripts.js'
import mongo from '#mongo'
import { createHttpTerminator } from 'http-terminator'
import { app } from './app.ts'
import config from '#config'

const server = createServer(app)
const httpTerminator = createHttpTerminator({ server })

// cf https://connectreport.com/blog/tuning-http-keep-alive-in-node-js/
// timeout is often 60s on the reverse proxy, better to a have a longer one here
// so that interruption is managed downstream instead of here
server.keepAliveTimeout = (60 * 1000) + 1000
server.headersTimeout = (60 * 1000) + 2000

i18n.configure({ ...config.i18n, directory: resolve(import.meta.dirname, '../i18n') })

export const start = async () => {
  if (config.observer.active) await startObserver(config.observer.port)
  session.init(config.privateDirectoryUrl)
  await mongo.init()
  await locks.init(mongo.db)
  // await upgradeScripts(mongo.db, resolve(import.meta.dirname, '../..'))

  // TODO: run users planned deletion worker

  server.listen(config.port)
  await new Promise(resolve => server.once('listening', resolve))

  console.log(`API server listening on port ${config.port}`)
}

export const stop = async () => {
  await httpTerminator.terminate()
  if (config.observer.active) await stopObserver()
  await mongo.client.close()
}
