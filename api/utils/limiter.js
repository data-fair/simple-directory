const { RateLimiterMongo, RateLimiterMemory } = require('rate-limiter-flexible')
const config = require('config')

// protect authentication routes with rate limiting to prevent brute force attacks
let _limiter
const limiterOptions = {
  keyPrefix: 'sd-rate-limiter-auth',
  points: config.authRateLimit.attempts,
  duration: config.authRateLimit.duration
}
module.exports = (req) => {
  if (config.storage.type === 'mongo') {
    _limiter = _limiter || new RateLimiterMongo({
      storeClient: req.app.get('storage').client,
      dbName: req.app.get('storage').db.databaseName,
      ...limiterOptions
    })
  } else {
    _limiter = _limiter || new RateLimiterMemory(limiterOptions)
  }
  return _limiter
}
