const limiter = require('../utils/limiter')
const asyncWrap = require('../utils/async-wrap')
const requestIp = require('request-ip')
const jwt = require('../utils/jwt')

// simply get a token to perform an anonymous action in the close future
// useful to ensure that the user is human and waits for a little while before submitting a form
module.exports = asyncWrap(async (req, res, next) => {
  try {
    await limiter(req).consume(requestIp.getClientIp(req), 1)
  } catch (err) {
    console.error('Rate limit error for /anonymous-action route', requestIp.getClientIp(req), req.body.email, err)
    return res.status(429).send(req.messages.errors.rateLimitAuth)
  }
  const payload = { anonymousAction: true, validation: 'wait' }
  const token = jwt.sign(req.app.get('keys'), payload, '1d', '8s')
  res.send(token)
})