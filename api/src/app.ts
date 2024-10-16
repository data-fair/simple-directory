import config from '#config'
import { Router } from 'express'
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const util = require('util')
const dayjs = require('./utils/dayjs')
const storages = require('./storages')
const mails = require('./mails')
const tokens = require('./utils/tokens')
const limits = require('./utils/limits')
const saml2 = require('./utils/saml2')
const oauth = require('./utils/oauth')
const metrics = require('./utils/metrics')
const twoFA = require('./routers/2fa.js')
const auth = require('./routers/auth')
const i18n = require('../i18n')
const debug = require('debug')('app')

const app = express()
export default app

app.set('json spaces', 2)

app.use(cookieParser())
app.use(bodyParser.json({ limit: '100kb' }))
app.use(i18n.middleware)
// Replaces reqUser(req) from session with full and fresh user object from storage
// also minimalist api key management
const fullUser = async (req, res, next) => {
  if (reqUser(req) && !reqUser(req).orgStorage && reqUser(req).id !== '_superadmin') {
    reqUser(req) = {
      ...await req.app.get('storage').getUser({ id: reqUser(req).id }),
      isAdmin: reqUser(req).isAdmin,
      adminMode: reqUser(req).adminMode,
      activeAccount: reqUser(req).activeAccount
    }
  }

  const apiKey = req.get('x-apiKey') || req.get('x-api-key') || req.query.apiKey
  if (apiKey) {
    if (apiKey !== config.secretKeys.readAll) {
      return res.status(401).send('bad api key')
    } else {
      if (req.method !== 'GET') return res.status(403).send('api key is only for read endpoints')
      reqUser(req) = {
        isAdmin: true,
        adminMode: true,
        id: 'readAll',
        organizations: []
      }
    }
  }
  next()
}

// set current baseUrl, i.e. the url of simple-directory on the current user's domain
const publicUrl = new URL(config.publicUrl)
let basePath = publicUrl.pathname
if (basePath.endsWith('/')) basePath = basePath.slice(0, -1)
const setSite = async (req, res, next) => {
  const host = req.get('host')
  if (host && ![publicUrl.host, `simple-directory:${config.port}`].includes(host) && !(process.env.NODE_ENV === 'production' && host === `localhost:${config.port}`)) {
    if (!config.manageSites) throw createHttpError(400, `multi-sites not supported by this install of simple-directory, host=${host}, declared host=${publicUrl.host}`)
    // TODO: use a small memory cache for this very frequent query ?
    req.site = await app.get('storage').getSiteByHost(host)
    if (!req.site) return res.status(404).send('unknown site')
    const url = new URL(config.publicUrl)
    url.host = host
    req.publicBaseUrl = url.href
  } else {
    req.publicBaseUrl = config.publicUrl
  }
  req.publicBasePath = basePath
  next()
}

const apiDocs = require('../contract/api-docs')
app.get('/api/api-docs.json', (req, res) => res.json(apiDocs))
app.get('/api/auth/anonymous-action', require('./routers/anonymous-action'))
app.use('/api/auth', setSite, session.auth, auth.router)
app.use('/api/mails', session.auth, require('./routers/mails'))
app.use('/api/users', setSite, session.auth, fullUser, require('./routers/users'))
app.use('/api/organizations', setSite, session.auth, fullUser, require('./routers/organizations'))
app.use('/api/invitations', setSite, session.auth, fullUser, require('./routers/invitations'))
app.use('/api/avatars', setSite, session.auth, fullUser, require('./routers/avatars'))
app.use('/api/limits', session.auth, limits.router)
app.use('/api/2fa', twoFA.router)
app.get('/api/metrics', require('./routers/metrics'))
if (config.manageSites) {
  app.use('/api/sites', setSite, session.auth, require('./routers/sites'))
}
app.use('/api/oauth-tokens', setSite, session.auth, require('./routers/oauth-tokens'))

let info = { version: process.env.NODE_ENV }
try { info = require('../BUILD.json') } catch (err) {}
app.get('/api/info', session.requiredAuth, (req, res) => {
  res.send(info)
})

app.use('/api/', (req, res) => {
  return res.status(404).send('unknown api endpoint')
})

exports.run = async () => {
  debug('start run method')

  const eventsLog = (await import('@data-fair/lib-express/events-log.js')).default

  const errorHandler = (await import('@data-fair/lib/express/error-handler.js')).default

  // Error management
  app.use(errorHandler)

  debug('prepare keys')
  const keys = await tokens.init()
  app.set('keys', keys)
  app.use(tokens.router(keys))

  debug('prepare storage')
  const storage = await storages.initGlobal()
  app.set('storage', storage)

  debug('prepare mail transport')
  const mailTransport = await mails.init()
  app.set('mailTransport', mailTransport)

  debug('prepare oauth providers')
  await oauth.init()
  debug('prepare saml2 providers')
  await saml2.init()

  if (storage.db) {
    // await require('../upgrade')(storage.db)

    const locks = require('./utils/locks')
    const webhooks = require('./webhooks')

    await locks.init(storage.db)
    // a simple cron to manage user deletions
    const cron = require('node-cron')
    const moment = require('moment')
    console.info('run user cleanup cron loop', config.cleanupCron)
  }

  // Run a handy development mail server
  if (config.maildev.active) {
    const MailDev = require('maildev')
    const maildev = new MailDev(config.maildev)
    maildev.listenAsync = util.promisify(maildev.listen)
    maildev.closeAsync = util.promisify(maildev.close)
    await maildev.listenAsync()
    app.set('maildev', maildev)
  }

  if (config.observer.active) {
    const { startObserver } = await import('@data-fair/lib/node/observer.js')
    await metrics.init(storage.db)
    await startObserver()
  }

  debug('start server')
  server.listen(config.port)
  await eventToPromise(server, 'listening')
  console.log(`listening on localhost:${config.port}`)
  console.log(`exposed on ${config.publicUrl}`)

  return app
}

exports.stop = async () => {
  await httpTerminator.terminate()

  app.get('mailTransport').close()
  if (config.maildev.active) {
    await app.get('maildev').closeAsync()
  }

  if (config.observer.active) {
    const { stopObserver } = await import('@data-fair/lib/node/observer.js')
    await stopObserver()
  }
}
