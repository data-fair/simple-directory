import { RateLimiterMongo, RateLimiterRes } from 'rate-limiter-flexible'
import config from '#config'
import mongo from '#mongo'

// protect authentication routes with rate limiting to prevent brute force attacks
let _limiter: (key: string) => Promise<boolean> | undefined

export default () => {
  if (!_limiter) {
    const rateLimiterMongo = new RateLimiterMongo({
      storeClient: mongo.client,
      dbName: mongo.db.databaseName,
      keyPrefix: 'sd-rate-limiter-auth',
      points: config.authRateLimit.attempts,
      duration: config.authRateLimit.duration
    })
    _limiter = async (key: string) => {
      try {
        await rateLimiterMongo.consume(key, 1)
      } catch (err) {
        if (err instanceof RateLimiterRes) return false
        throw err
      }
      return true
    }
  }
  return _limiter
}

// per-recipient mail rate limit, prevents a bug or runaway webhook from spamming a user's mailbox
let _mailLimiter: (key: string) => Promise<boolean> | undefined

export const mailLimiter = () => {
  if (!_mailLimiter) {
    const rateLimiterMongo = new RateLimiterMongo({
      storeClient: mongo.client,
      dbName: mongo.db.databaseName,
      keyPrefix: 'sd-rate-limiter-mail',
      points: config.mailsRateLimit.points,
      duration: config.mailsRateLimit.duration
    })
    _mailLimiter = async (key: string) => {
      try {
        await rateLimiterMongo.consume(key, 1)
      } catch (err) {
        if (err instanceof RateLimiterRes) return false
        throw err
      }
      return true
    }
  }
  return _mailLimiter
}
