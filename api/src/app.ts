import config from '#config'
import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { session, errorHandler } from '@data-fair/lib-express'
import anonymousAction from './anonymous-action/router.ts'
import auth from './auth/router.ts'
import limits from './limits/router.ts'
import twoFA from './2fa/router.ts'
import mails from './mails/router.ts'
import users from './users/router.ts'
import organizations from './organizations/router.ts'
import invitations from './invitations/router.ts'
import avatars from './avatars/router.ts'
import oauthTokens from './oauth-tokens/router.ts'
import tokens from './tokens/router.ts'

const app = express()
export default app

app.set('json spaces', 2)

app.use(cookieParser())
app.use(bodyParser.json({ limit: '100kb' }))

// Replaces reqUser(req) from session with full and fresh user object from storage
// also minimalist api key management
/* const fullUser = async (req, res, next) => {
  if (reqUser(req) && !reqUser(req).orgStorage && reqUser(req).id !== '_superadmin') {
    reqUser(req) = {
      ...await storages.globalStorage.getUser({ id: reqUser(req).id }),
      isAdmin: reqUser(req).isAdmin,
      adminMode: reqUser(req)?.adminMode,
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
} */

const apiDocs = require('../contract/api-docs')
app.get('/api/api-docs.json', (req, res) => res.json(apiDocs))
app.get('/api/auth/anonymous-action', anonymousAction)
app.use('/api/auth', session.middleware(), auth)
app.use('/api/mails', session.middleware(), mails)
app.use('/api/users', session.middleware(), users)
app.use('/api/organizations', session.middleware(), organizations)
app.use('/api/invitations', session.middleware(), invitations)
app.use('/api/avatars', session.middleware(), avatars)
app.use('/api/limits', auth, limits)
app.use('/api/2fa', twoFA)
app.use('/api/oauth-tokens', session.middleware(), oauthTokens)
if (config.manageSites) {
  app.use('/api/sites', session.middleware(), (await import('./sites/router.ts')).default)
}

let info = { version: process.env.NODE_ENV }
try { info = require('../BUILD.json') } catch (err) {}
// TODO: see data-fair for latest admin info implementation
app.get('/api/info', session.middleware({ required: true }), (req, res) => {
  res.send(info)
})

app.use('/api/', (req, res) => {
  return res.status(404).send('unknown api endpoint')
})
app.use(tokens)

app.use(errorHandler)
