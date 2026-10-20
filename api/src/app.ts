import { resolve } from 'node:path'
import config from '#config'
import uiConfig from './ui-config.ts'
import apiDocs from '../contract/api-docs.ts'
import express, { type RequestHandler } from 'express'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import { session, errorHandler, createSiteMiddleware, createSpaMiddleware, defaultNonceCSPDirectives, setReqUser, httpError } from '@data-fair/lib-express'
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
import scopes from './scopes/router.ts'
import sites from './sites/router.ts'
import accounts from './accounts/router.ts'
import passwordLists from './password-lists/router.ts'
import { scopeGate } from './utils/scope-gate.ts'
import oauthServer from './oauth-server/router.ts'
import oauthInteraction from './oauth-server/interaction.ts'
import { getSiteExtraParams } from './sites/spa-params.ts'

const app = express()
export default app

app.use(helmet({
  strictTransportSecurity: new URL(config.publicUrl).protocol === 'https:',
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      // very restrictive by default, index.html of the UI will have custom rules defined in createSpaMiddleware
      // https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html#security-headers
      'frame-ancestors': ["'none'"],
      'default-src': ["'none'"]
    }
  }
}))

// no fancy embedded arrays, just string and arrays of strings in req.query
app.set('query parser', 'simple')
app.set('json spaces', 2)

app.use(cookieParser())
app.use(createSiteMiddleware('simple-directory'))
// the authorization server answers before any session handling, it authenticates its clients itself
app.use(oauthServer)
// scoped operations answer bearer calls from any origin, without credentials (dashboards on other
// domains); /api/oauth/* was answered above, with the per-client CORS of the authorization server
app.use(session.bearerCors())
// the oidc provider parses its own request bodies
const jsonParser = bodyParser.json({ limit: '100kb' })
app.use((req, res, next) => /^\/api\/oauth\//.test(req.url) ? next() : jsonParser(req, res, next))
app.use(session.middleware())
app.use(scopeGate)

// minimalist api key management
const readApiKey: RequestHandler = async (req, res, next) => {
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
app.use('/api/accounts', accounts)
app.use('/api/scopes', scopes)
app.use('/api/sites', sites)
app.use('/api/password-lists', passwordLists)
// SD's side of the authorization code flow: reads the SD session (the dispatcher above only lets
// the exact interaction paths through)
app.use('/api/oauth/interaction', oauthInteraction)

// /api/test-env exposes unauthenticated super-admin primitives (mutate config, seed users, rotate keys, wipe DB).
// It is gated behind both NODE_ENV ∈ {development,test} *and* an explicit ENABLE_TEST_API=1 opt-in.
// Refuses to start at all if NODE_ENV=production, regardless of the opt-in.
if (process.env.ENABLE_TEST_API === '1') {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: ENABLE_TEST_API=1 is forbidden when NODE_ENV=production — refusing to start.')
    process.exit(1)
  }
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    console.error(`FATAL: ENABLE_TEST_API=1 requires NODE_ENV ∈ {development, test}, got "${process.env.NODE_ENV}" — refusing to start.`)
    process.exit(1)
  }
  console.warn('⚠️  /api/test-env IS MOUNTED — unauthenticated admin surface. ENABLE_TEST_API=1 + NODE_ENV=' + process.env.NODE_ENV + '. DO NOT expose this process to untrusted networks.')
  const testEnv = (await import('./test-env.ts')).default
  app.use('/api/test-env', testEnv)
}

app.use('/api/', (req, res) => {
  res.status(404).send('unknown api endpoint')
})
app.use(tokens)

// the OAuth consent page must not be framed, not even by a same-origin page (clickjacking of the
// decision): same paths as the UI router, which matches case insensitively with an optional
// trailing slash
const isConsentPage = (path: string) => {
  try {
    return /^\/oauth\/consent\/?$/i.test(decodeURIComponent(path))
  } catch {
    return false
  }
}
const consentCSPDirectives = { ...defaultNonceCSPDirectives, 'frame-ancestors': "'none'" }

if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    if (isConsentPage(req.path)) res.setHeader('X-Frame-Options', 'DENY')
    next()
  })
  app.use(await createSpaMiddleware(resolve(import.meta.dirname, '../../ui/dist'), uiConfig, {
    csp: { nonce: true, header: (req) => isConsentPage(req.path) ? consentCSPDirectives : true },
    getSiteExtraParams
  }))
}

app.use(errorHandler)
