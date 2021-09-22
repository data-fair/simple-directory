const config = require('config')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const http = require('http')
const util = require('util')
const eventToPromise = require('event-to-promise')
const cors = require('cors')
const storages = require('./storages')
const mails = require('./mails')
const asyncWrap = require('./utils/async-wrap')
const tokens = require('./utils/tokens')
const limits = require('./utils/limits')
const twoFA = require('./routers/2fa.js')
const session = require('@koumoul/sd-express')({
  directoryUrl: config.publicUrl,
  privateDirectoryUrl: 'http://localhost:' + config.port,
})
const i18n = require('../i18n')
const debug = require('debug')('app')

const app = express()
const server = http.createServer(app)

app.set('json spaces', 2)

app.use(cookieParser())
app.use(bodyParser.json({ limit: '100kb' }))
app.use(i18n.middleware)
app.use((req, res, next) => {
  if (!req.app.get('api-ready')) res.status(503).send(req.messages.errors.serviceUnavailable)
  else next()
})
// Replaces req.user from session with full and fresh user object from storage
// also minimalist api key management
const fullUser = asyncWrap(async (req, res, next) => {
  if (req.user) {
    req.user = {
      ...await req.app.get('storage').getUser({ id: req.user.id }),
      isAdmin: req.user.isAdmin,
      adminMode: req.user.adminMode,
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
        organizations: [],
      }
    }
  }
  next()
})

// set current baseUrl, i.e. the url of simple-directory on the current user's domain
const basePath = new URL(config.publicUrl).pathname
app.use('/api', (req, res, next) => {
  const u = originalUrl(req)
  req.publicBaseUrl = u.full ? formatUrl({ protocol: u.protocol, hostname: u.hostname, port: u.port, pathname: basePath.slice(0, -1) }) : config.publicUrl
  req.publicBasePath = basePath
  next()
})
const apiDocs = require('../contract/api-docs')
app.get('/api/api-docs.json', cors(), (req, res) => res.json(apiDocs))
app.get('/api/auth/anonymous-action', cors(), require('./routers/anonymous-action'))
app.use('/api/auth', sessionCors, session.auth, require('./routers/auth').router)
app.use('/api/mails', sessionCors, require('./routers/mails'))
app.use('/api/users', sessionCors, session.auth, fullUser, require('./routers/users'))
app.use('/api/organizations', sessionCors, session.auth, fullUser, require('./routers/organizations'))
app.use('/api/invitations', sessionCors, session.auth, fullUser, require('./routers/invitations'))
app.use('/api/avatars', sessionCors, session.auth, fullUser, require('./routers/avatars'))
app.use('/api/limits', sessionCors, session.auth, limits.router)
app.use('/api/2fa', sessionCors, twoFA.router)

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

exports.run = async() => {
  debug('start run method')
  if (!config.listenWhenReady) {
    debug('start server')
    server.listen(config.port)
    await eventToPromise(server, 'listening')
  }

  debug('prepare keys')
  const keys = await tokens.init()
  app.set('keys', keys)
  app.use(tokens.router(keys))

  debug('prepare storage')
  const storage = await storages.init()
  app.set('storage', storage)

  debug('prepare mail transport')
  const mailTransport = await mails.init()
  app.set('mailTransport', mailTransport)

  // Run a handy development mail server
  if (config.maildev.active) {
    const MailDev = require('maildev')
    const maildev = new MailDev(config.maildev)
    maildev.listenAsync = util.promisify(maildev.listen)
    maildev.closeAsync = util.promisify(maildev.close)
    await maildev.listenAsync()
    app.set('maildev', maildev)
  }
  app.set('api-ready', true)

  if (!config.noUI) {
    app.use((req, res, next) => {
      if (!req.app.get('ui-ready')) res.status(503).send(req.messages.errors.serviceUnavailable)
      else next()
    })

    debug('prepare nuxt')
    const nuxt = await require('./nuxt')()
    app.use(session.auth)
    app.use(nuxt)
    app.set('ui-ready', true)
  }

  if (config.listenWhenReady) {
    debug('start server')
    server.listen(config.port)
    await eventToPromise(server, 'listening')
  }

  if (process.env.NODE_ENV === 'development') {
    const server2 = http.createServer(app)
    console.log(`listen on secondary port ${config.port + 1} to simulate multi-domain exposition`)
    server2.listen(config.port + 1)
    await eventToPromise(server2, 'listening')
  }

  return app
}

exports.stop = async() => {
  server.close()
  await eventToPromise(server, 'close')

  app.get('mailTransport').close()
  if (config.maildev.active) {
    await app.get('maildev').closeAsync()
  }
}
