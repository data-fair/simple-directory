const config = require('config')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const http = require('http')
const util = require('util')
const eventToPromise = require('event-to-promise')
const originalUrl = require('original-url')
const { format: formatUrl } = require('url')
const cors = require('cors')
const storages = require('./storages')
const mails = require('./mails')
const asyncWrap = require('./utils/async-wrap')
const tokens = require('./utils/tokens')
const limits = require('./utils/limits')
const twoFA = require('./routers/2fa.js')
const session = require('@koumoul/sd-express')({
  directoryUrl: config.publicUrl,
  privateDirectoryUrl: 'http://localhost:' + config.port
})
const i18n = require('../i18n')
const debug = require('debug')('app')

const app = express()
const server = http.createServer(app)

app.set('json spaces', 2)

if (process.env.NODE_ENV === 'development') {
  // Create a mono-domain environment with other services in dev
  const { createProxyMiddleware } = require('http-proxy-middleware')
  app.use('/notify', createProxyMiddleware({ target: 'http://localhost:8088', pathRewrite: { '^/notify': '' } }))
}

app.use(cookieParser())
app.use(bodyParser.json({ limit: '100kb' }))
app.use(i18n.middleware)
// Replaces req.user from session with full and fresh user object from storage
// also minimalist api key management
const fullUser = asyncWrap(async (req, res, next) => {
  if (req.user && !req.user.orgStorage) {
    req.user = {
      ...await req.app.get('storage').getUser({ id: req.user.id }),
      isAdmin: req.user.isAdmin,
      adminMode: req.user.adminMode
    }
  }

  const apiKey = req.get('x-apiKey') || req.get('x-api-key') || req.query.apiKey
  if (apiKey) {
    if (apiKey !== config.secretKeys.readAll) {
      return res.status(401).send('bad api key')
    } else {
      if (req.method !== 'GET') return res.status(403).send('api key is only for read endpoints')
      req.user = {
        isAdmin: true,
        adminMode: true,
        id: 'readAll',
        organizations: []
      }
    }
  }
  next()
})

// set current baseUrl, i.e. the url of simple-directory on the current user's domain
const publicUrl = new URL(config.publicUrl)
let basePath = publicUrl.pathname
if (basePath.endsWith('/')) basePath = basePath.slice(0, -1)
app.use((req, res, next) => {
  const u = originalUrl(req)
  const urlParts = { protocol: u.protocol, hostname: u.hostname, pathname: basePath }
  if (u.port !== 443 && u.port !== 80) urlParts.port = u.port
  req.publicBaseUrl = u.full ? formatUrl(urlParts) : config.publicUrl
  req.publicBasePath = basePath
  next()
})

// login is always done on the main domain with a redirect to the child domain
app.use('/login', (req, res, next) => {
  if (req.baseUrl === '/login' && req.publicBaseUrl !== config.publicUrl) {
    const url = new URL(config.publicUrl + '/login')
    for (const key in req.query) {
      url.searchParams.set(key, req.query[key])
    }
    url.searchParams.set('redirect', req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl + '/me')
    res.redirect(url.href)
  } else {
    next()
  }
})
const apiDocs = require('../contract/api-docs')
app.get('/api/api-docs.json', cors(), (req, res) => res.json(apiDocs))
app.get('/api/auth/anonymous-action', cors(), require('./routers/anonymous-action'))
app.use('/api/auth', session.auth, require('./routers/auth').router)
app.use('/api/mails', session.auth, require('./routers/mails'))
app.use('/api/users', session.auth, fullUser, require('./routers/users'))
app.use('/api/organizations', session.auth, fullUser, require('./routers/organizations'))
app.use('/api/invitations', session.auth, fullUser, require('./routers/invitations'))
app.use('/api/avatars', session.auth, fullUser, require('./routers/avatars'))
app.use('/api/limits', session.auth, limits.router)
app.use('/api/2fa', twoFA.router)
app.get('/api/metrics', require('./routers/metrics'))

let info = { version: process.env.NODE_ENV }
try { info = require('../BUILD.json') } catch (err) {}
app.get('/api/info', session.requiredAuth, (req, res) => {
  res.send(info)
})
app.get('/api/admin/info', session.requiredAuth, (req, res) => {
  if (!req.user.adminMode) return res.status(403).send()
  res.send({ ...info, config })
})

/*
*  WARNING:
*  the next few lines are here only to maintain compatibility for installed clients
*  that have an older version of sd-vue
*/
app.post('/api/session/keepalive', session.auth, asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send('No active session to keep alive')
  debug(`Exchange session token for user ${req.user.name}`)
  await tokens.keepalive(req, res)
  res.status(204).send()
}))
// end of compatibility only section

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || err.status
  if (err.statusCode === 500 || !err.statusCode) console.error('Error in express route', err)
  if (!res.headersSent) {
    res.status(err.statusCode || 500)
    if (['development', 'test'].includes(process.env.NODE_ENV)) {
      res.send(err.stack)
    } else {
      res.send(err.message)
    }
  }
})

exports.run = async () => {
  debug('start run method')

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

  if (storage.db) {
    const locks = require('./utils/locks')
    const webhooks = require('./webhooks')

    await locks.init(storage.db)
    // a simple cron to manage user deletions
    const cron = require('node-cron')
    const moment = require('moment')
    console.info('run user deletion cron loop', config.cleanupCron)
    cron.schedule(config.cleanupCron, async () => {
      try {
        console.info('run user deletion cron task')
        await locks.acquire(storage.db, 'user-deletion-task')
        const plannedDeletion = moment().add(config.plannedDeletionDelay, 'days').format('YYYY-MM-DD')
        for (const user of await storage.findInactiveUsers()) {
          console.log('plan deletion of inactive user', user)
          await storage.patchUser(user.id, { plannedDeletion })
          await mails.send({
            transport: mailTransport,
            key: 'plannedDeletion',
            messages: i18n.messages[i18n.defaultLocale], // TODO: use a locale stored on the user ?
            to: user.email,
            params: { host: user.created.host || new URL(config.publicBaseUrl).host, user: user.name, plannedDeletion }
          })
        }
        for (const user of await storage.findUsersToDelete()) {
          console.log('execute planned deletion of user', user)
          await storage.deleteUser(user.id)
          webhooks.deleteIdentity('user', user.id)
        }
        await locks.release(storage.db, 'user-deletion-task')
        console.info('user deletion cron task done\n\n')
      } catch (err) {
        console.error('problem while running user deletion cron task', err)
      }
    })
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

  if (!config.noUI) {
    app.use(session.auth)

    debug('prepare nuxt')
    const nuxt = await require('./nuxt')()
    app.set('nuxt', nuxt.instance)
    app.use(cors(), nuxt.render)
  }

  debug('start server')
  server.listen(config.port)
  await eventToPromise(server, 'listening')

  if (process.env.NODE_ENV === 'development') {
    const server2 = http.createServer(app)
    console.log(`listen on secondary port ${config.port + 1} to simulate multi-domain exposition`)
    server2.listen(config.port + 1)
    await eventToPromise(server2, 'listening')
  }

  return app
}

exports.stop = async () => {
  server.close()
  await eventToPromise(server, 'close')

  app.get('mailTransport').close()
  if (config.maildev.active) {
    await app.get('maildev').closeAsync()
  }
}
