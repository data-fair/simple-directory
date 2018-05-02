const config = require('config')
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const http = require('http')
const util = require('util')
const eventToPromise = require('event-to-promise')
const storages = require('./storages')
const mails = require('./mails')
const i18n = require('../i18n')

const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(cookieParser())
app.use(bodyParser.json({limit: '100kb'}))
app.use(i18n.middleware)

const JSONWebKey = require('json-web-key')
const publicKey = JSONWebKey.fromPEM(fs.readFileSync(path.join(__dirname, '..', config.secret.public)))
publicKey.kid = config.kid
publicKey.alg = 'RS256'
publicKey.use = 'sig'
app.get('/.well-known/jwks.json', (req, res) => {
  res.json({'keys': [publicKey.toJSON()]})
})

const apiDocs = require('../contract/api-docs')
app.get('/api/v1/api-docs.json', (req, res) => res.json(apiDocs))
app.use('/api/v1/auth', require('./routers/auth').router)
app.use('/api/v1/users', require('./routers/users'))
app.use('/api/v1/organizations', require('./routers/organizations'))

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
  const nuxt = await require('./nuxt')()
  app.use(nuxt)

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

  const storage = await storages.init()
  app.set('storage', storage)

  server.listen(config.port)
  await eventToPromise(server, 'listening')
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
