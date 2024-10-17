const { RateLimiterMongo, RateLimiterMemory } = require('rate-limiter-flexible')
import config from '#config'

// protect authentication routes with rate limiting to prevent brute force attacks
let _limiter
const limiterOptions = {
  keyPrefix: 'sd-rate-limiter-auth',
  points: config.authRateLimit.attempts,
  duration: config.authRateLimit.duration
}
export default  (req) => {
  if (config.storage.type === 'mongo') {
    _limiter = _limiter || new RateLimiterMongo({
      storeClient: storages.globalStorage.client,
      dbName: storages.globalStorage.db.databaseName,
      ...limiterOptions
    })
  } else {
    _limiter = _limiter || new RateLimiterMemory(limiterOptions)
  }
  return _limiter
}
