import { resolve } from 'node:path'
import config, { uiConfig } from '#config'
import apiDocs from '../contract/api-docs.ts'
import express, { type RequestHandler } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { session, errorHandler, createSiteMiddleware, createSpaMiddleware, setReqUser, reqSession, httpError } from '@data-fair/lib-express'
import admin from './admin/router.ts'
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
import sites from './sites/router.ts'
import storages from './storages/index.ts'
import { keepalive, getTokenPayload } from '#services'

const app = express()
export default app

// no fancy embedded arrays, just string and arrays of strings in req.query
app.set('query parser', 'simple')
app.set('json spaces', 2)

app.use(cookieParser())
app.use(bodyParser.json({ limit: '100kb' }))
app.use(createSiteMiddleware('simple-directory'))
app.use(session.middleware())

// minimalist api key management
const readApiKey: RequestHandler = async (req, res, next) => {
  /*
  // always refresh session user with actual current data
  const sessionState = reqSession(req)
  if (sessionState.user && !sessionState.user.os && sessionState.user.id !== '_superadmin') {
    const fullUser = await storages.globalStorage.getUser(sessionState.user.id)
    if (fullUser) {
      sessionState.user = getTokenPayload(fullUser)
    }
  }
  */

  const apiKey = req.get('x-apiKey') || req.get('x-api-key') || req.query.apiKey
  if (apiKey) {
    if (apiKey !== config.secretKeys.readAll) {
      return res.status(401).send('bad api key')
    } else {
      if (req.method !== 'GET') throw httpError(403, 'api key is only for read endpoints')
      setReqUser(req, {
        isAdmin: 1,
        adminMode: 1,
        id: 'readAll',
        email: 'read-all@api-key',
        name: 'Read all API key',
        organizations: []
      })
    }
  }
  next()
}

app.get('/api/api-docs.json', (req, res) => res.send(apiDocs))
app.use('/api/admin', admin)
app.get('/api/auth/anonymous-action', anonymousAction)
app.use('/api/auth', auth)
app.use('/api/mails', mails)
app.use('/api/users', readApiKey, users)
app.use('/api/organizations', readApiKey, organizations)
app.use('/api/invitations', invitations)
app.use('/api/avatars', avatars)
app.use('/api/limits', auth, limits)
app.use('/api/2fa', twoFA)
app.use('/api/oauth-tokens', oauthTokens)
if (config.manageSites) app.use('/api/sites', sites)

// maintain compatibility for installed clients that have an older version of sd-vue
app.post('/api/session/keepalive', async (req, res, next) => {
  await keepalive(req, res)
  res.status(204).send()
})

app.use('/api/', (req, res) => {
  res.status(404).send('unknown api endpoint')
})
app.use(tokens)

// app.use(await createSpaMiddleware(resolve(import.meta.dirname, '../../ui/dist'), uiConfig))

app.use(errorHandler)