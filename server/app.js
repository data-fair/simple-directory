const config = require('config')
const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const http = require('http')
const util = require('util')
const eventToPromise = require('event-to-promise')
const cors = require('cors')
const { createHttpTerminator } = require('http-terminator')
const createHttpError = require('http-errors')
const dayjs = require('./utils/dayjs')
const storages = require('./storages')
const mails = require('./mails')
const asyncWrap = require('./utils/async-wrap')
const tokens = require('./utils/tokens')
const limits = require('./utils/limits')
const saml2 = require('./utils/saml2')
const oauth = require('./utils/oauth')
const metrics = require('./utils/metrics')
const twoFA = require('./routers/2fa.js')
const auth = require('./routers/auth')
const session = require('@data-fair/sd-express')({
  directoryUrl: config.publicUrl,
  privateDirectoryUrl: 'http://localhost:' + config.port
})
const i18n = require('../i18n')
const debug = require('debug')('app')

const app = express()
const server = http.createServer(app)
const httpTerminator = createHttpTerminator({ server })

// cf https://connectreport.com/blog/tuning-http-keep-alive-in-node-js/
// timeout is often 60s on the reverse proxy, better to a have a longer one here
// so that interruption is managed downstream instead of here
server.keepAliveTimeout = (60 * 1000) + 1000
server.headersTimeout = (60 * 1000) + 2000

app.set('json spaces', 2)

app.use(cookieParser())
app.use(bodyParser.json({ limit: '100kb' }))
app.use(i18n.middleware)
// Replaces req.user from session with full and fresh user object from storage
// also minimalist api key management
const fullUser = asyncWrap(async (req, res, next) => {
  if (req.user && !req.user.orgStorage && req.user.id !== '_superadmin') {
    req.user = {
      ...await req.app.get('storage').getUser({ id: req.user.id }),
      isAdmin: req.user.isAdmin,
      adminMode: req.user.adminMode,
      activeAccount: req.user.activeAccount
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
const setSite = asyncWrap(async (req, res, next) => {
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
})

const apiDocs = require('../contract/api-docs')
app.get('/api/api-docs.json', cors(), (req, res) => res.json(apiDocs))
app.get('/api/auth/anonymous-action', cors(), require('./routers/anonymous-action'))
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

/*
*  WARNING:
*  the next few lines are here only to maintain compatibility for installed clients
*  that have an older version of sd-vue
*/
app.post('/api/session/keepalive', setSite, session.auth, asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send('No active session to keep alive')
  debug(`Exchange session token for user ${req.user.name}`)
  await tokens.keepalive(req, res)
  res.status(204).send()
}))
// end of compatibility only section

app.use('/api/', (req, res) => {
  return res.status(404).send('unknown api endpoint')
})

exports.run = async () => {
  debug('start run method')

  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default

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

    const planDeletion = async (user) => {
      const plannedDeletion = moment().add(config.plannedDeletionDelay, 'days').format('YYYY-MM-DD')
      await storage.patchUser(user.id, { plannedDeletion })
      eventsLog.warn('sd.cleanup-cron.plan-deletion', 'planned deletion of inactive user', { user })
      const link = config.publicUrl + '/login?email=' + encodeURIComponent(user.email)
      const linkUrl = new URL(link)
      if (user.emailConfirmed || user.logged) {
        await mails.send({
          transport: mailTransport,
          key: 'plannedDeletion',
          messages: i18n.messages[i18n.defaultLocale], // TODO: use a locale stored on the user ?
          to: user.email,
          params: {
            link,
            host: linkUrl.host,
            origin: linkUrl.origin,
            user: user.name,
            plannedDeletion: dayjs(plannedDeletion).locale(i18n.defaultLocale).format('L'),
            cause: i18n.messages[i18n.defaultLocale].mails.plannedDeletion.causeInactivity.replace('{date}', dayjs(user.logged || user.created.date).locale(i18n.defaultLocale).format('L'))
          }
        })
        eventsLog.warn('sd.cleanup-cron.inactive.email', `sent an email of planned deletion to inactive user ${user.email}`, { user })
      }
    }

    cron.schedule(config.cleanup.cron, async () => {
      const { internalError } = await import('@data-fair/lib/node/observer.js')
      try {
        console.info('run user cleanup cron task')
        await locks.acquire(storage.db, 'user-deletion-task')
        if (config.cleanup.deleteInactive) {
          for (const user of await storage.findInactiveUsers()) {
            await planDeletion(user)
          }
        }

        for (const token of await storage.findOfflineOAuthTokens()) {
          // TODO manage offline tokens from site level providers
          const provider = oauth.providers.find(p => p.id === token.provider.id)
          const user = await storage.getUser({ id: token.user.id })
          if (!provider) {
            console.error('offline token for unknown provider', token)
          } else if (!user) {
            console.error('offline token for unknown user', token)
          } else {
            try {
              const refreshedToken = await provider.refreshToken(token.token, false)
              const { newToken, offlineRefreshToken } = refreshedToken
              const userInfo = await provider.userInfo(newToken.access_token)
              const memberInfo = await auth.authCoreProviderMemberInfo(storage, null, provider, user.email, userInfo)
              await auth.patchCoreOAuthUser(storage, provider, user, userInfo, memberInfo)
              await storage.writeOAuthToken(user, provider, newToken, offlineRefreshToken, token.loggedOut)
              eventsLog.info('sd.cleanup-cron.offline-token.refresh-ok', `a user refreshed their info from their core identity provider ${provider.id}`, { user })
            } catch (err) {
              if (err?.data?.payload?.error === 'invalid_grant') {
                await storage.deleteOAuthToken(user, provider)
                eventsLog.warn('sd.cleanup-cron.offline-token.delete', `deleted invalid offline token for user ${user.id} and provider ${provider.id}`, { user })
                await planDeletion(user)
              } else {
                internalError('cleanup-refresh-token', err)
              }
            }
          }
        }

        for (const user of await storage.findUsersToDelete()) {
          console.log('execute planned deletion of user', user)
          await storage.deleteUser(user.id)
          eventsLog.warn('sd.cleanup-cron.delete', 'deleted user', { user })
          webhooks.deleteIdentity('user', user.id)
        }
        await locks.release(storage.db, 'user-deletion-task')
        console.info('user cleanup cron task done\n\n')
      } catch (err) {
        internalError('cleanup-cron', err)
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
