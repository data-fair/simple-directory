const util = require('util')
const axios = require('axios')
const express = require('express')
const jwt = require('jsonwebtoken')
const jwksRsa = require('jwks-rsa')
const assert = require('assert')
jwt.verifyAsync = util.promisify(jwt.verify)
const asyncWrap = require('./async-wrap')
const debug = require('debug')('session')

module.exports = ({directoryUrl, publicUrl, cookieName, cookieOpts}) => {
  assert.ok(!!directoryUrl, 'directoryUrl parameter is required')
  assert.ok(!!publicUrl, 'publicUrl parameter is required')
  debug('Init with parameters', {directoryUrl, publicUrl, cookieName, cookieOpts})

  cookieName = cookieName || 'id_token'

  // As secure as possible cookie parameters by default
  //  - httpOnly against cross site scripting (XSS)
  //  - sameSite against cross site request forgery (CSRF)
  //  - secure against theft during transport by forcing HTTPS
  cookieOpts = cookieOpts || {httpOnly: true, sameSite: true, secure: true}
  if (['test', 'development'].includes(process.env.NODE_ENV)) delete cookieOpts.secure

  const jwksClient = jwksRsa({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: directoryUrl + '/.well-known/jwks.json'
  })
  jwksClient.getSigningKeyAsync = util.promisify(jwksClient.getSigningKey)

  const auth = _auth(directoryUrl, publicUrl, jwksClient, cookieName, cookieOpts)
  const loginCallback = _loginCallback(publicUrl, jwksClient, cookieName, cookieOpts)
  const login = _login(directoryUrl, publicUrl)
  const logout = _logout(cookieName)
  const router = express.Router()
  router.get('/login', login)
  router.post('/logout', logout)
  router.post('/keepalive', auth, (req, res) => res.status(204).send())

  return {auth, loginCallback, login, logout, router}
}

// Fetch the public info of signing key from the directory that acts as jwks provider
async function _verifyToken(jwksClient, token) {
  const decoded = jwt.decode(token, {complete: true})
  const signingKey = await jwksClient.getSigningKeyAsync(decoded.header.kid)
  return jwt.verifyAsync(token, signingKey.publicKey || signingKey.rsaPublicKey)
}

// This middleware detects that we are coming from an authentication link (probably in an email)
// and creates a new session accordingly
function _loginCallback(publicUrl, jwksClient, cookieName, cookieOpts) {
  return asyncWrap(async (req, res, next) => {
    // Get a JWT in a id_token query parameter = coming from a link in an email
    const linkToken = req.query.id_token
    if (linkToken) {
      try {
        debug(`Verify JWT token from the query parameter`)
        const payload = await _verifyToken(jwksClient, linkToken)
        debug('JWT token from query parameter is ok, store it in cookie', payload)
        res.cookie(cookieName, linkToken, {...cookieOpts, expires: new Date(payload.exp * 1000)})
      } catch (err) {
        // Token expired or bad in another way..
        // TODO: a way to display warning to user ? throw error ?
        debug('JWT token from query parameter is broken', err)
      }
      const reloadUrl = publicUrl + req.path
      debug('Reload current page without query parameter', reloadUrl)
      return res.redirect(reloadUrl)
    }
    next()
  })
}

// This middleware checks if a user has an active session
// it can extend this session if necessary.
function _auth(directoryUrl, publicUrl, jwksClient, cookieName, cookieOpts) {
  return asyncWrap(async (req, res, next) => {
    // JWT in a cookie = already active session
    let token = req.cookies[cookieName]
    if (token) {
      try {
        debug(`Verify JWT token from the ${cookieName} cookie`)
        req.user = await _verifyToken(jwksClient, token)
        debug('JWT token from cookie is ok', req.user)
      } catch (err) {
        // Token expired or bad in another way.. delete the cookie
        debug('JWT token from cookie is broken, clear it', err)
        res.clearCookie(cookieName)
      }
    }

    // We have a token from cookie
    // Does it need to be exchanged to prolongate the session ?
    if (req.user && req.user.exp) {
      debug('JWT token from cookie is set to expire on', new Date(req.user.exp * 1000))
      const timestamp = Date.now() / 1000
      // Token is more than 12 hours old or has less than half an hour left
      const tooOld = timestamp > (req.user.iat + 43200)
      const shortLife = timestamp > (req.user.exp - 1800)
      if (tooOld) debug('The token was issued more than 12 hours ago, exchange it for a new one')
      if (shortLife) debug('The token will expire in less than half an hour, exchange it for a new one')
      if (tooOld || shortLife) {
        const exchangeRes = await axios.post(directoryUrl + '/api/auth/exchange', null, {headers: {Authorization: 'Bearer ' + token}})
        const exchangedToken = exchangeRes.data
        req.user = await _verifyToken(jwksClient, exchangedToken)
        debug('Exchanged token is ok, store it', req.user)
        res.cookie(cookieName, exchangedToken, {...cookieOpts, expires: new Date(req.user.exp * 1000)})
      }
    }
    next()
  })
}

// Login is simply a link to the right page of the directory.
// Going to the directory through a redirect, not throug a link in UI allows us
// to send along some optional client id or any kind of trust enhancing secret
function _login(directoryUrl, publicUrl) {
  return (req, res) => {
    res.redirect(directoryUrl + '/api/auth/passwordless?redirect=' + encodeURIComponent(req.query.redirect || publicUrl))
  }
}

// Sessions are only the persistence of the JWT token in cookies
// no need to call the directory
function _logout(cookieName) {
  return (req, res) => {
    res.clearCookie(cookieName)
    res.status(204).send()
  }
}
