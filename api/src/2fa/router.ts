import { authenticator } from 'otplib'
import qrcode from 'qrcode'
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { reqIp, reqSiteUrl, httpError } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import emailValidator from 'email-validator'
import storages from '#storages'
import { reqI18n } from '#i18n'
import limiter from '../utils/limiter.ts'
import { checkPassword, hashPassword, reqSite } from '#services'

const router = Router()
export default router

router.post('/', async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  if (!req.body.password) return res.status(400).send(reqI18n(req).messages.errors.badCredentials)

  try {
    await limiter(req).consume(reqIp(req), 1)
  } catch (err) {
    eventsLog.warn('sd.2fa.rate-limit', `rate limit error for /2fa route with email ${req.body.email}`, { req })
    return res.status(429).send(reqI18n(req).messages.errors.rateLimitAuth)
  }

  const storage = storages.globalStorage
  const user = await storage.getUserByEmail(req.body.email, await reqSite(req))
  if (!user || user.emailConfirmed === false) return res.status(400).send(reqI18n(req).messages.errors.badCredentials)
  if (storage.getPassword) {
    const storedPassword = await storage.getPassword(user.id)
    const validPassword = await checkPassword(req.body.password, storedPassword)
    if (!validPassword) return res.status(400).send(reqI18n(req).messages.errors.badCredentials)
  } else if (storage.checkPassword) {
    if (!await storage.checkPassword(user.id, req.body.password)) {
      return res.status(400).send(reqI18n(req).messages.errors.badCredentials)
    }
  } else {
    throw new Error('no password verification implemented')
  }

  const user2FA = await storage.get2FA(user.id)
  if (user2FA && user2FA.active) {
    return res.status(400).send(reqI18n(req).messages.errors.conflict2FA)
  }

  if (!req.body.token) {
    // initialize secret
    const secret = authenticator.generateSecret()
    const otpauth = authenticator.keyuri(user.name, reqSiteUrl(req), secret)
    await storage.set2FA(user.id, { secret, active: false })
    eventsLog.info('sd.2fa.init', `user initialized 2fa ${req.body.email}`, { req, user })
    res.send({ otpauth, qrcode: await qrcode.toDataURL(otpauth) })
  } else {
    // validate secret with initial token
    if (!user2FA) throw httpError(400)
    const isValid = authenticator.check(req.body.token, user2FA.secret)
    if (!isValid) return res.status(400).send(reqI18n(req).messages.errors.bad2FAToken)
    const recovery = randomUUID()
    await storage.set2FA(user.id, { ...user2FA, active: true, recovery: await hashPassword(recovery) })
    eventsLog.info('sf.2fa.recover', `user recovered 2fa with initial token ${req.body.email}`, { req, user })
    res.send({ recovery })
  }
})
