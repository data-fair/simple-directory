import { RateLimiterMongo } from 'rate-limiter-flexible'
import { type Request } from 'express'
import config from '#config'
import mongo from '#mongo'

// protect authentication routes with rate limiting to prevent brute force attacks
let _limiter: RateLimiterMongo | undefined
const limiterOptions = {
  keyPrefix: 'sd-rate-limiter-auth',
  points: config.authRateLimit.attempts,
  duration: config.authRateLimit.duration
}
export default (req: Request) => {
  _limiter = _limiter || new RateLimiterMongo({
    storeClient: mongo.client,
    dbName: mongo.db.databaseName,
    ...limiterOptions
  })
  return _limiter
}
