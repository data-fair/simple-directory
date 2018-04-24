const config = require('config')
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const http = require('http')
const eventToPromise = require('event-to-promise')
const storages = require('./storages')

const app = express()
const server = http.createServer(app)

app.use(cors())
app.use(cookieParser())
app.use(bodyParser.json({limit: '100kb'}))

const JSONWebKey = require('json-web-key')
const publicKey = JSONWebKey.fromPEM(fs.readFileSync(path.join(__dirname, '..', config.secret.public)))
publicKey.kid = config.kid
publicKey.alg = 'RS256'
publicKey.use = 'sig'
app.get('/.well-known/jwks.json', (req, res) => {
  res.json({'keys': [publicKey.toJSON()]})
})

const apiDocs = require('../contract/api-docs')
app.get('/api/api-docs.json', (req, res) => res.json(apiDocs))
app.use('/api/auth', require('./auth'))
app.use('/api/users', require('./users'))
app.use('/api/organizations', require('./organizations'))

// Error handling to complement express default error handling. TODO do something useful of errors.
app.use((err, req, res, next) => {
  // Default error handler of express is actually not bad.
  // It will send stack to client only if not in production and manage interrupted streams.
  next(err)
})

exports.run = async() => {
  const nuxt = await require('./nuxt')()
  app.use(nuxt)
  const storage = await storages.init()
  app.set('storage', storage)
  server.listen(config.port)
  await eventToPromise(server, 'listening')
}

exports.stop = async() => {
  server.close()
  await eventToPromise(server, 'close')
}
