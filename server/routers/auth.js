const config = require('config')
const express = require('express')
const URL = require('url').URL
const emailValidator = require('email-validator')
const bodyParser = require('body-parser')
const requestIp = require('request-ip')
const shortid = require('shortid')
const { RateLimiterMongo, RateLimiterMemory } = require('rate-limiter-flexible')
const jwt = require('../utils/jwt')
const asyncWrap = require('../utils/async-wrap')
const mails = require('../mails')
const passwords = require('../utils/passwords')
const webhooks = require('../webhooks')
const oauth = require('../utils/oauth')
const userName = require('../utils/user-name')
const debug = require('debug')('auth')

let router = exports.router = express.Router()

// these routes accept url encoded form data so that they can be used from basic
// html forms
router.use(bodyParser.urlencoded({ limit: '100kb' }))

// protect authentication routes with rate limiting to prevent brute force attacks
let _limiter
const limiterOptions = {
  keyPrefix: 'sd-rate-limiter-auth',
  points: config.authRateLimit.attempts,
  duration: config.authRateLimit.duration
}
const limiter = (req) => {
  if (config.storage.type === 'mongo') {
    _limiter = _limiter || new RateLimiterMongo({ storeClient: req.app.get('storage').client, ...limiterOptions })
  } else {
    _limiter = _limiter || new RateLimiterMemory(limiterOptions)
  }
  return _limiter
}

// Either find or create an user based on an email address then send a mail with a link and a token
// to check that this address belongs to the user.
router.post('/passwordless', asyncWrap(async (req, res, next) => {
  if (!config.passwordless) return res.status(400).send(req.messages.errors.noPasswordless)
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)

  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /passwordless route', requestIp.getClientIp(req), req.body.email, err)
    return res.status(429).send(req.messages.errors.rateLimitAuth)
  }

  const storage = req.app.get('storage')
  let user = await storage.getUserByEmail(req.body.email)
  // No 404 here so we don't disclose information about existence of the user
  if (!user || user.emailConfirmed === false) {
    const link = req.query.redirect || config.defaultLoginRedirect || config.publicUrl
    const linkUrl = new URL(link)
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'noCreation',
      messages: req.messages,
      to: req.body.email,
      params: { link, host: linkUrl.host, origin: linkUrl.origin }
    })
    return res.status(204).send()
  }

  const payload = jwt.getPayload(user)
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
  const linkUrl = new URL(req.query.redirect || config.defaultLoginRedirect || config.publicUrl + '/me')
  linkUrl.searchParams.set('id_token', token)
  debug(`Passwordless authentication of user ${user.name}`)
  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'login',
    messages: req.messages,
    to: user.email,
    params: { link: linkUrl.href, host: linkUrl.host, origin: linkUrl.origin }
  })
  res.status(204).send()
}))

// Used to extend an older but still valid token from a user or to validate a passwordless id_token
router.post('/exchange', asyncWrap(async (req, res, next) => {
  const idToken = (req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop())
  if (!idToken) {
    return res.status(401).send('No id_token cookie provided')
  }
  let decoded
  try {
    decoded = await jwt.verify(req.app.get('keys'), idToken)
  } catch (err) {
    return res.status(401).send('Invalid id_token')
  }

  // User may have new organizations since last renew
  const storage = req.app.get('storage')
  const user = await storage.getUser({ id: decoded.id })
  if (!user) return res.status(401).send('User does not exist anymore')
  const payload = jwt.getPayload(user)
  if (decoded.adminMode && req.query.noAdmin !== 'true') payload.adminMode = true
  if (decoded.asAdmin) {
    payload.asAdmin = decoded.asAdmin
    payload.name = decoded.name
    payload.isAdmin = false
  } else {
    if (!storage.readonly) {
      await storage.updateLogged(decoded.id)
      if (user.emailConfirmed === false) {
        await storage.confirmEmail(decoded.id)
        webhooks.postIdentity('user', user)
      }
    }
  }
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
  debug(`Exchange session token for user ${user.name}`)
  res.send(token)
}))

// Authenticate a user based on his email address and password
router.post('/password', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  if (!req.body.password) return res.status(400).send(req.messages.errors.badCredentials)

  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /password route', requestIp.getClientIp(req), req.body.email, err)
    return res.status(429).send(req.messages.errors.rateLimitAuth)
  }

  const storage = req.app.get('storage')
  const user = await storage.getUserByEmail(req.body.email)
  if (!user || user.emailConfirmed === false) return res.status(400).send(req.messages.errors.badCredentials)
  const storedPassword = await storage.getPassword(user.id)
  const validPassword = await passwords.checkPassword(req.body.password, storedPassword)
  if (!validPassword) return res.status(400).send(req.messages.errors.badCredentials)
  const payload = jwt.getPayload(user)
  if (req.body.adminMode) {
    if (payload.isAdmin) payload.adminMode = true
    else return res.status(403).send('Admin mode for superadmins only')
  }
  if (!storage.readonly) await storage.updateLogged(user.id)
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
  const linkUrl = new URL(req.query.redirect || config.defaultLoginRedirect || config.publicUrl + '/me')
  linkUrl.searchParams.set('id_token', token)
  debug(`Password based authentication of user ${user.name}`)
  if (req.is('application/x-www-form-urlencoded')) res.redirect(linkUrl.href)
  else res.send(linkUrl.href)
}))

// Send an email to confirm user identity before authorizing an action
router.post('/action', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  if (!req.body.action) return res.status(400).send(req.messages.errors.badCredentials)

  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /action route', requestIp.getClientIp(req), req.body.email, err)
    return res.status(429).send(req.messages.errors.rateLimitAuth)
  }

  const storage = req.app.get('storage')
  let user = await storage.getUserByEmail(req.body.email)
  // No 404 here so we don't disclose information about existence of the user
  if (!user || user.emailConfirmed === false) {
    const link = req.query.redirect || config.defaultLoginRedirect || config.publicUrl
    const linkUrl = new URL(link)
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'noCreation',
      messages: req.messages,
      to: req.body.email,
      params: { link, host: linkUrl.host, origin: linkUrl.origin }
    })
    return res.status(204).send()
  }

  const payload = jwt.getPayload(user)
  payload.action = req.body.action
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
  const linkUrl = new URL(req.body.target || config.publicUrl + '/login')
  linkUrl.searchParams.set('action_token', token)

  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'action',
    messages: req.messages,
    to: user.email,
    params: { link: linkUrl.href, host: linkUrl.host, origin: linkUrl.origin }
  })
  res.status(204).send()
}))

// create a session has a user but from a super admin session
router.post('/asadmin', asyncWrap(async (req, res, next) => {
  const idToken = (req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop())
  if (!idToken) {
    return res.status(401).send('No id_token cookie provided')
  }
  let decoded
  try {
    decoded = await jwt.verify(req.app.get('keys'), idToken)
  } catch (err) {
    return res.status(401).send('Invalid id_token')
  }
  if (!decoded.isAdmin) return res.status(403).send('This functionality is for admins only')
  const storage = req.app.get('storage')
  const user = await storage.getUser({ id: req.body.id })
  if (!user) return res.status(404).send('User does not exist')
  const payload = jwt.getPayload(user)
  payload.name += ' (administration)'
  payload.asAdmin = { id: decoded.id, name: decoded.name }
  payload.isAdmin = false
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
  debug(`Exchange session token for user ${user.name} from an admin session`)
  res.send(token)
}))
router.delete('/asadmin', asyncWrap(async (req, res, next) => {
  const idToken = (req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop())
  if (!idToken) {
    return res.status(401).send('No id_token cookie provided')
  }
  let decoded
  try {
    decoded = await jwt.verify(req.app.get('keys'), idToken)
  } catch (err) {
    return res.status(401).send('Invalid id_token')
  }
  if (!decoded.asAdmin) return res.status(403).send('This functionality is for admins only')
  const storage = req.app.get('storage')
  const user = await storage.getUser({ id: decoded.asAdmin.id })
  if (!user) return res.status(401).send('User does not exist anymore')
  const payload = jwt.getPayload(user)
  payload.adminMode = true
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
  debug(`Exchange session token for user ${user.name} from an asAdmin session`)
  res.send(token)
}))

router.get('/oauth/providers', (req, res) => {
  res.send(oauth.publicProviders)
})

router.get('/oauth/:oauthId/login', asyncWrap(async (req, res, next) => {
  const provider = oauth.providers.find(p => p.id === req.params.oauthId)
  if (!provider) return res.status(404).send('Unknown OAuth provider')
  res.redirect(provider.authorizationUri)
}))

router.get('/oauth/:oauthId/callback', asyncWrap(async (req, res, next) => {
  const storage = req.app.get('storage')

  const provider = oauth.providers.find(p => p.id === req.params.oauthId)
  if (!provider) return res.status(404).send('Unknown OAuth provider')

  if (req.query.error) {
    console.error('Bad OAuth query', req.query)
    throw new Error('Bad OAuth query')
  }
  const userInfo = await provider.userInfo(await provider.accessToken(req.query.code))
  if (!userInfo.email) {
    console.error('Bad user from oauth', userInfo)
    return res.status(500).send('Bad user from oauth')
  }
  debug('Got user info from oauth', req.params.oauthId, userInfo)

  const oauthInfo = { ...userInfo, logged: new Date().toISOString() }

  // check for user with same email
  let user = await storage.getUserByEmail(userInfo.email)

  // Re-create a user that was never validated.. first clean temporary user
  if (user && user.emailConfirmed === false) {
    await storage.deleteUser(user.id)
    user = null
  }

  if (!user) {
    if (config.onlyCreateInvited || storage.readonly) return res.status(403).send('Unknown user for email ' + userInfo.email)
    user = {
      email: userInfo.email,
      id: shortid.generate(),
      firstName: userInfo.firstName || '',
      lastName: userInfo.lastName || '',
      emailConfirmed: true,
      oauth: {
        [req.params.oauthId]: oauthInfo
      }
    }
    user.name = userName(user)
    debug('Create user authenticated through oauth', user)
    await storage.createUser(user)
  } else {
    debug('Existing user authenticated through oauth', user, userInfo)
    const patch = { oauth: { ...user.oauth, [req.params.oauthId]: oauthInfo } }
    if (userInfo.firstName && !user.firstName) patch.firstName = userInfo.firstName
    if (userInfo.lastName && !user.lastName) patch.lastName = userInfo.lastName
    await storage.patchUser(user.id, patch)
  }

  const payload = jwt.getPayload(user)
  if (!storage.readonly) await storage.updateLogged(user.id)
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
  const linkUrl = new URL(config.defaultLoginRedirect || config.publicUrl + '/me')
  linkUrl.searchParams.set('id_token', token)
  debug(`OAuth based authentication of user ${user.name}`)
  res.redirect(linkUrl.href)
}))
