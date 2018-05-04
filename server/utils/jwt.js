const config = require('config')
const fs = require('fs')
const path = require('path')
const util = require('util')
const jwt = require('jsonwebtoken')
const asyncVerify = util.promisify(jwt.verify)

const privateKey = fs.readFileSync(path.join(__dirname, '../..', config.secret.private))
const publicKey = exports.publicKey = fs.readFileSync(path.join(__dirname, '../..', config.secret.public))

exports.sign = (payload, expiresIn) => jwt.sign(payload, privateKey, {
  algorithm: 'RS256',
  expiresIn,
  keyid: config.kid
})

exports.verify = async token => asyncVerify(token, publicKey)
