const config = require('config')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const http = require('http')
const util = require('util')
const eventToPromise = require('event-to-promise')
const storages = require('./storages')
const mails = require('./mails')
const asyncWrap = require('./utils/async-wrap')
const jwt = require('./utils/jwt')
const session = require('@koumoul/sd-express')({
  directoryUrl: config.publicUrl,
  publicUrl: config.publicUrl,
  privateDirectoryUrl: 'http://localhost:' + config.port,
  cookieDomain: config.sessionDomain
})
const i18n = require('../i18n')

const app = express()
const server = http.createServer(app)

app.use(session.cors({}))
app.use(cookieParser())
app.use(bodyParser.json({ limit: '100kb' }))
app.use(i18n.middleware)
app.use((req, res, next) => {
  if (!req.app.get('api-ready')) res.status(503).send(req.messages.errors.serviceUnavailable)
  else next()
})

// Replaces req.user from session with full and fresh user object from storage
const fullUser = asyncWrap(async (req, res, next) => {
  if (!req.user) return next()
  req.user = {
    ...await req.app.get('storage').getUser({ id: req.user.id }),
    isAdmin: req.user.isAdmin,
    adminMode: req.user.adminMode
  }
  next()
})

const apiDocs = require('../contract/api-docs')
app.get('/api/api-docs.json', (req, res) => res.json(apiDocs))
app.use('/api/auth', require('./routers/auth').router)
app.use('/api/mails', require('./routers/mails'))
app.use('/api/users', session.auth, fullUser, require('./routers/users'))
app.use('/api/organizations', session.auth, fullUser, require('./routers/organizations'))
app.use('/api/invitations', session.auth, fullUser, require('./routers/invitations'))
app.use('/api/avatars', session.auth, fullUser, require('./routers/avatars'))
app.use('/api/session', session.router)

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
  if (!config.listenWhenReady) {
    server.listen(config.port)
    await eventToPromise(server, 'listening')
  }

  const keys = await jwt.init()
  app.set('keys', keys)
  app.use(jwt.router(keys))

  const storage = await storages.init()
  app.set('storage', storage)

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

    const nuxt = await require('./nuxt')()
    app.use(session.loginCallback)
    app.use(session.decode)
    app.use(nuxt)
    app.set('ui-ready', true)
  }

  if (config.listenWhenReady) {
    server.listen(config.port)
    await eventToPromise(server, 'listening')
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
