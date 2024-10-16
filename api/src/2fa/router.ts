import config from '#config'
const { authenticator } = require('otplib')
const qrcode = require('qrcode')
import { Router } from 'express'
const requestIp = require('request-ip')
const emailValidator = require('email-validator')
const { v4: uuidv4 } = require('uuid')
const tokens = require('../utils/tokens')
const limiter = require('../utils/limiter')
const passwords = require('../utils/passwords')
// const debug = require('debug')('2fa')

const router = exports.router = Router()

// TODO: apply some rate limiting

exports.checkSession = async (req, userId) => {
  const token = req.cookies[exports.cookieName(userId)]
  if (!token) return false
  let decoded
  try {
    decoded = await tokens.verify(req.app.get('keys'), token)
  } catch (err) {
    console.error('invalid 2fa token', err)
    return false
  }
  if (decoded.user !== userId) return false
  return true
}

exports.isValid = (twoFA, token) => {
  return authenticator.check(token, twoFA.secret)
}

exports.cookieName = (userId) => 'id_token_2fa_' + userId

router.post('/', async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib-express/events-log.js')).default

  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  if (!req.body.password) return res.status(400).send(req.messages.errors.badCredentials)

  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    eventsLog.warn('sd.2fa.rate-limit', `rate limit error for /2fa route with email ${req.body.email}`, { req })
    return res.status(429).send(req.messages.errors.rateLimitAuth)
  }

  const storage = req.app.get('storage')
  const user = await storage.getUserByEmail(req.body.email, req.site)
  if (!user || user.emailConfirmed === false) return res.status(400).send(req.messages.errors.badCredentials)
  if (storage.getPassword) {
    const storedPassword = await storage.getPassword(user.id)
    const validPassword = await passwords.checkPassword(req.body.password, storedPassword)
    if (!validPassword) return res.status(400).send(req.messages.errors.badCredentials)
  } else {
    if (!await storage.checkPassword(user.id, req.body.password)) {
      return res.status(400).send(req.messages.errors.badCredentials)
    }
  }

  const user2FA = await storage.get2FA(user.id)
  if (user2FA && user2FA.active) {
    return res.status(400).send(req.messages.errors.conflict2FA)
  }

  if (!req.body.token) {
    // initialize secret
    const secret = authenticator.generateSecret()
    const otpauth = authenticator.keyuri(user.name, new URL(config.publicUrl).host, secret)
    await storage.patchUser(user.id, { '2FA': { secret, active: false } })
    eventsLog.info('sd.2fa.init', `user initialized 2fa ${req.body.email}`, { req, user })
    res.send({ otpauth, qrcode: await qrcode.toDataURL(otpauth) })
  } else {
    // validate secret with initial token
    const isValid = authenticator.check(req.body.token, user2FA.secret)
    if (!isValid) return res.status(400).send(req.messages.errors.bad2FAToken)
    const recovery = uuidv4()
    await storage.patchUser(user.id, { '2FA': { ...user2FA, active: true, recovery: await passwords.hashPassword(recovery) } })
    eventsLog.info('sf.2fa.recover', `user recovered 2fa with initial token ${req.body.email}`, { req, user })
    res.send({ recovery })
  }
})
