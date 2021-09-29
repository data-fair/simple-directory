const config = require('config')
const path = require('path')
const util = require('util')
const { exec } = require('child_process')
const execAsync = util.promisify(exec)
const fs = require('fs-extra')
const express = require('express')
const jwt = require('jsonwebtoken')
const asyncVerify = util.promisify(jwt.verify)
const JSONWebKey = require('json-web-key')
const Cookies = require('cookies')

exports.init = async () => {
  const keys = {}
  const privateKeyPath = path.resolve(__dirname, '../..', config.secret.private)
  const publicKeyPath = path.resolve(__dirname, '../..', config.secret.public)
  try {
    await fs.access(privateKeyPath, fs.constants.F_OK)
  } catch (err) {
    if (err.code !== 'ENOENT') throw (err)
    console.log(`Private key ${privateKeyPath} doesn't exist. Create it with openssl.`)
    await fs.ensureDir(path.dirname(privateKeyPath))
    await fs.ensureDir(path.dirname(publicKeyPath))
    await execAsync(`openssl genpkey -algorithm RSA -out ${privateKeyPath} -pkeyopt rsa_keygen_bits:2048`)
    await execAsync(`openssl rsa -in ${privateKeyPath} -outform PEM -pubout -out  ${publicKeyPath}`)
  }
  keys.private = await fs.readFile(privateKeyPath)
  keys.public = await fs.readFile(publicKeyPath)
  return keys
}

exports.router = (keys) => {
  const router = express.Router()
  const publicKey = JSONWebKey.fromPEM(keys.public)
  publicKey.kid = config.kid
  publicKey.alg = 'RS256'
  publicKey.use = 'sig'
  router.get('/.well-known/jwks.json', (req, res) => {
    res.json({ keys: [publicKey.toJSON()] })
  })
  return router
}

exports.sign = (keys, payload, expiresIn, notBefore) => {
  const params = {
    algorithm: 'RS256',
    expiresIn,
    keyid: config.kid,
  }
  if (notBefore) params.notBefore = notBefore
  return jwt.sign(payload, keys.private, params)
}

exports.verify = async (keys, token) => asyncVerify(token, keys.public)

exports.decode = (token) => jwt.decode(token)

exports.getPayload = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    organizations: user.organizations,
    isAdmin: config.admins.includes(user.email),
  }
  if (user.department) payload.department = user.department
  return payload
}

// Split JWT strategy, the signature is in a httpOnly cookie for XSS prevention
// the header and payload are not httpOnly to be readable by client
// all cookies use sameSite for CSRF prevention
exports.setCookieToken = (req, res, token, org) => {
  const cookies = new Cookies(req, res)

  // remove cookies on deprecated domain (stop using wildcard domain cookies)
  if (config.oldSessionDomain) {
    cookies.set('id_token', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_sign', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_org', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_2fa', null, { domain: config.oldSessionDomain })
  }

  const payload = exports.decode(token)
  const parts = token.split('.')
  const opts = { sameSite: 'lax' }
  if (payload.rememberMe) opts.expires = new Date(payload.exp * 1000)
  cookies.set('id_token', parts[0] + '.' + parts[1], { ...opts, httpOnly: false })
  cookies.set('id_token_sign', parts[2], { ...opts, httpOnly: true })
  // set the same params to id_token_org cookie so that it doesn't expire before the rest
  org = org || cookies.get('id_token_org')
  if (org) {
    if (payload.organizations.find(o => o.id === org)) {
      cookies.set('id_token_org', org, { ...opts, httpOnly: false })
    } else {
      cookies.set('id_token_org', null)
    }
  }
}

exports.keepalive = async (req, res) => {
  // User may have new organizations since last renew
  const storage = req.app.get('storage')
  const user = await storage.getUser({ id: req.user.id })
  if (!user) return res.status(401).send('User does not exist anymore')

  const payload = exports.getPayload(user)
  if (req.user.isAdmin && req.user.adminMode && req.query.noAdmin !== 'true') payload.adminMode = true
  if (req.user.asAdmin) {
    payload.asAdmin = req.user.asAdmin
    payload.name = req.user.name
    payload.isAdmin = false
  } else {
    if (!storage.readonly) {
      await storage.updateLogged(req.user.id)
    }
  }
  const token = exports.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
  exports.setCookieToken(req, res, token)
}
