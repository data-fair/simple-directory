import { resolve } from 'node:path'
import { createServer } from 'node:http'
import { session } from '@data-fair/lib-express/index.js'
import { startObserver, stopObserver } from '@data-fair/lib-node/observer.js'
import locks from '@data-fair/lib-node/locks.js'
import upgradeScripts from '@data-fair/lib-node/upgrade-scripts.js'
import mongo from '#mongo'
import * as usersWorker from './users/worker.ts'
import * as keysManager from './tokens/keys-manager.ts'
import * as oauth from './oauth/service.ts'
import * as metrics from './utils/metrics.ts'
import * as saml2 from './saml2/service.ts'
import mailsTransport from './mails/transport.ts'
import storages from '#storages'
import { createHttpTerminator } from 'http-terminator'
import app from './app.ts'
import config from '#config'
import { publicProviders } from './auth/providers.ts'
import { getSiteColorsWarnings } from './utils/color.ts'

const server = createServer(app)
const httpTerminator = createHttpTerminator({ server })

// cf https://connectreport.com/blog/tuning-http-keep-alive-in-node-js/
// timeout is often 60s on the reverse proxy, better to a have a longer one here
// so that interruption is managed downstream instead of here
server.keepAliveTimeout = (60 * 1000) + 1000
server.headersTimeout = (60 * 1000) + 2000

export const start = async () => {
  session.init('http://localhost:' + config.port, 'fr', (req) => {
    // on keepalive route we accept a older token if it is accompanied by a valid exchange token
    return req.method === 'POST' && req.url === '/api/auth/keepalive'
  })
  await mongo.init()
  await locks.start(mongo.db)
  await Promise.all([
    oauth.init(),
    saml2.init(),
    storages.init(),
    config.observer.active && startObserver(config.observer.port),
    usersWorker.start(),
    mailsTransport.start(),
    keysManager.start(),
    metrics.init()
  ])
  await upgradeScripts(mongo.db, locks, resolve(import.meta.dirname, '../..'))

  const colorWarnings = getSiteColorsWarnings(config.i18n.defaultLocale, config.theme, await publicProviders())
  if (colorWarnings.length) {
    console.error('Configuration contains color warnings')
    for (const cw of colorWarnings) console.error('  - ' + cw)
  }

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
