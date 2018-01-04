const fs = require('fs')
const path = require('path')
const config = require('config')
const publicKey = fs.readFileSync(path.join(__dirname, '..', config.secret.public))
const expressJWT = require('express-jwt')

module.exports.jwtMiddleware = expressJWT({
  secret: publicKey,
  getToken: function (req) {
    return (req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop())
  }
})

module.exports.optionalJwtMiddleware = expressJWT({
  secret: publicKey,
  credentialsRequired: false,
  getToken: function (req) {
    return (req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop())
  }
})
