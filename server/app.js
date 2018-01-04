const config = require('config')
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const storages = require('./storages')

let app = module.exports = express()
app.use(cors())
app.use(cookieParser())
app.use(bodyParser.json({
  limit: '100kb'
}))

const JSONWebKey = require('json-web-key')
const publicKey = JSONWebKey.fromPEM(fs.readFileSync(path.join(__dirname, '..', config.secret.public)))
publicKey.kid = config.kid
publicKey.alg = 'RS256'
publicKey.use = 'sig'
app.get('/.well-known/jwks.json', (req, res) => {
  res.json({
    'keys': [publicKey.toJSON()]
  })
})

const apiDocs = require('../contract/api-docs')
app.get('/api/api-docs.json', (req, res) => {
  res.json(apiDocs)
})

app.use('/api/auth', require('./auth'))
app.use('/api/users', require('./users'))
app.use('/api/organizations', require('./organizations'))

// Static routing
const oneWeek = process.env.NODE_ENV === 'development' ? 0 : 7 * 24 * 60 * 60
const staticOptions = {
  setHeaders: (res) => {
    res.set('cache-control', 'public, max-age=' + oneWeek)
  }
}
app.use('/bundles', express.static(path.join(__dirname, '../public/bundles'), staticOptions))
app.use('/assets', express.static(path.join(__dirname, '../public/assets'), staticOptions))

const pug = require('pug')
const compiledIndex = pug.compileFile(path.join(__dirname, './index.pug'))
const renderedIndex = compiledIndex({
  appJS: config.publicUrl + '/bundles/' + require('../public/bundles/webpack-assets.json').main.js,
  config: JSON.stringify({
    publicUrl: config.publicUrl
  })
})
app.use('/*', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0')
  res.send(renderedIndex)
})

// Error handling to complement express default error handling. TODO do something useful of errors.
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).send('invalid token...')
  }
  console.error('Error, what to do ?', err.stack)
  // Default error handler of express is actually not bad.
  // It will send stack to client only if not in production and manage interrupted streams.
  next(err)
})

storages.init().then(storage => {
  app.set('storage', storage)
  app.listen(config.port, (err) => {
    if (err) {
      console.log('Could not run server : ', err.stack)
      throw err
    }
    console.log('Listening on http://localhost:%s', config.port)
    // Emit this event for the test suite
    app.emit('listening')
  })
}, err => {
  console.log('Could not run server : ', err.stack)
})
