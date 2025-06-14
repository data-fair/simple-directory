import { type RequestHandler } from 'express'
import config from '#config'
import { reqIp } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { nanoid } from 'nanoid'
import { reqI18n } from '#i18n'
import limiter from '../utils/limiter.ts'
import { signToken } from '#services'

// simply get a token to perform an anonymous action in the close future
// useful to ensure that the user is human and waits for a little while before submitting a form
const route: RequestHandler = async (req, res, next) => {
  if (!await limiter()(reqIp(req))) {
    eventsLog.warn('sd.anonym-action.rate-limit', 'rate limit error for /anonymous-action route', { req })
    return res.status(429).send(reqI18n(req).messages.errors.rateLimitAuth)
  }
  const payload = { anonymousAction: true, validation: 'wait', id: nanoid() }
  const token = await signToken(payload, config.anonymousAction.expiresIn, config.anonymousAction.notBefore)
  res.send(token)
}
export default route
