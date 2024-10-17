import { type Request, type Response, type NextFunction } from 'express'
import config from '#config'
import { reqIp } from '@data-fair/lib-express'
import { reqI18n } from '#i18n'
import limiter from '../utils/limiter.ts'

const tokens = require('../utils/tokens')

// simply get a token to perform an anonymous action in the close future
// useful to ensure that the user is human and waits for a little while before submitting a form
export default async (req: Request, res: Response, next: NextFunction) => {
  try {
    await limiter(req).consume(reqIp(req), 1)
  } catch (err) {
    const eventsLog = (await import('@data-fair/lib-express/events-log.js')).default
    eventsLog.warn('sd.anonym-action.rate-limit', 'rate limit error for /anonymous-action route', { req })
    return res.status(429).send(reqI18n(req).messages.errors.rateLimitAuth)
  }
  const payload = { anonymousAction: true, validation: 'wait' }
  const token = tokens.sign(req.app.get('keys'), payload, config.anonymousAction.expiresIn, config.anonymousAction.notBefore)
  res.send(token)
}
