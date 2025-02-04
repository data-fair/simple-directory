import { RateLimiterMongo, RateLimiterRes } from 'rate-limiter-flexible'
import config from '#config'
import mongo from '#mongo'

// protect authentication routes with rate limiting to prevent brute force attacks
let _limiter: (key: string) => Promise<boolean> | undefined
const limiterOptions = {
  keyPrefix: 'sd-rate-limiter-auth',
  points: config.authRateLimit.attempts,
  duration: config.authRateLimit.duration
}

export default () => {
  if (!_limiter) {
    const rateLimiterMongo = new RateLimiterMongo({
      storeClient: mongo.client,
      dbName: mongo.db.databaseName,
      ...limiterOptions
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
