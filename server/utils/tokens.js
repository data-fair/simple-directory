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
const defaultConfig = require('../../config/default.js')
const storages = require('../storages')
const twoFA = require('../routers/2fa.js')
const prometheus = require('./prometheus')

exports.init = async () => {
  const keys = {}
  const privateKeyPath = path.resolve(config.secret.private)
  const publicKeyPath = path.resolve(config.secret.public)
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
    keyid: config.kid
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
    organizations: (user.organizations || []).map(o => ({ ...o })),
    isAdmin: config.admins.includes(user.email) || (config.adminCredentials?.password?.hash && config.adminCredentials?.email === user.email)
  }
  if (user.defaultOrg) {
    let defaultOrg = payload.organizations.find(o => o.id === user.defaultOrg)
    if (user.defaultDep) defaultOrg = payload.organizations.find(o => o.id === user.defaultOrg && o.department === user.defaultDep)
    if (defaultOrg) defaultOrg.dflt = 1
  }
  if (user.ignorePersonalAccount) payload.ipa = 1
  if (user.orgStorage) payload.orgStorage = user.orgStorage
  if (user.readonly) payload.readonly = user.readonly
  if (user.ipa) payload.ipa = 1
  if (user.plannedDeletion) payload.pd = user.plannedDeletion
  return payload
}

exports.getDefaultUserOrg = (user, reqOrgId, reqDepId) => {
  if (!user.organizations || !user.organizations.length) return null
  if (reqOrgId) {
    let reqOrg
    if (reqDepId) {
      reqOrg = user.organizations.find(o => o.id === reqOrgId && o.department === reqDepId)
    } else {
      reqOrg = user.organizations.find(o => o.id === reqOrgId && !o.department) || user.organizations.find(o => o.id === reqOrgId)
    }
    if (reqOrg) return reqOrg
  }
  if (user.defaultOrg) {
    const defaultOrg = user.organizations.find(o => o.id === user.defaultOrg && (o.department || null) === (user.defaultDep || null))
    if (defaultOrg) return defaultOrg
  }
  if (user.ignorePersonalAccount) return user.organizations[0]
  return null
}

exports.unsetCookies = (req, res) => {
  const cookies = new Cookies(req, res)
  // use '' instead of null because instant cookie expiration is not properly applied on all safari versions
  cookies.set('id_token', '')
  cookies.set('id_token_sign', '')
  cookies.set('id_token_org', '')
  cookies.set('id_token_dep', '')

  // remove cookies on deprecated domain (stop using wildcard domain cookies)
  if (config.oldSessionDomain) {
    cookies.set('id_token', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_sign', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_org', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_dep', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_2fa', null, { domain: config.oldSessionDomain })
    if (req.user) cookies.set(twoFA.cookieName(req.user.id), null, { domain: config.oldSessionDomain })
  }
}

// Split JWT strategy, the signature is in a httpOnly cookie for XSS prevention
// the header and payload are not httpOnly to be readable by client
// all cookies use sameSite for CSRF prevention
exports.setCookieToken = (req, res, token, userOrg) => {
  const cookies = new Cookies(req, res)

  // remove cookies on deprecated domain (stop using wildcard domain cookies)
  if (config.oldSessionDomain) {
    cookies.set('id_token', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_sign', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_org', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_dep', null, { domain: config.oldSessionDomain })
    cookies.set('id_token_2fa', null, { domain: config.oldSessionDomain })
  }

  const payload = exports.decode(token)
  const parts = token.split('.')
  const opts = { sameSite: 'lax' }
  if (payload.rememberMe) opts.expires = new Date(payload.exp * 1000)
  cookies.set('id_token', parts[0] + '.' + parts[1], { ...opts, httpOnly: false })
  cookies.set('id_token_sign', parts[2], { ...opts, httpOnly: true })
  // set the same params to id_token_org cookie so that it doesn't expire before the rest
  if (userOrg) {
    cookies.set('id_token_org', userOrg.id, { ...opts, httpOnly: false })
    if (userOrg.department) cookies.set('id_token_dep', userOrg.department, { ...opts, httpOnly: false })
  }
}

exports.keepalive = async (req, res) => {
  // User may have new organizations since last renew
  let org
  if (req.user.organization) {
    org = await req.app.get('storage').getOrganization(req.user.organization.id)
    if (!org) {
      exports.unsetCookies(req, res)
      return res.status(401).send('Organization does not exist anymore')
    }
  }
  let storage = req.app.get('storage')
  if (req.user.orgStorage && org && org.orgStorage && org.orgStorage.active && config.perOrgStorageTypes.includes(org.orgStorage.type)) {
    storage = await storages.init(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }
  const user = req.user.id === '_superadmin' ? req.user : await storage.getUser({ id: req.user.id })
  if (!user) {
    exports.unsetCookies(req, res)
    return res.status(401).send('User does not exist anymore')
  }

  const payload = exports.getPayload(user)
  if (req.user.isAdmin && req.user.adminMode && req.query.noAdmin !== 'true') payload.adminMode = true
  if (req.user.rememberMe) payload.rememberMe = true
  if (req.user.asAdmin) {
    payload.asAdmin = req.user.asAdmin
    payload.name = req.user.name
    payload.isAdmin = false
  } else {
    if (!storage.readonly) {
      storage.updateLogged(req.user.id).catch((err) => {
        console.error('(update-logged) error while updating logged date', err)
        prometheus.internalError.inc({ errorCode: 'http' })
      })
    }
  }
  const token = exports.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
  const cookies = new Cookies(req, res)
  const userOrg = cookies.get('id_token_org') && user.organizations.find(o => o.id === cookies.get('id_token_org') && (o.department || null) === (decodeURIComponent(cookies.get('id_token_dep')) || null))
  exports.setCookieToken(req, res, token, userOrg)
}

// after validating auth (password, passwordless or oaut), we prepare a redirect to /token_callback
// this redirect is potentially on another domain, and it will do the actual set cookies with session tokens
exports.prepareCallbackUrl = (req, payload, redirect, userOrg, orgStorage) => {
  redirect = redirect || config.defaultLoginRedirect || req.publicBaseUrl + '/me'
  const redirectUrl = new URL(redirect)
  const token = exports.sign(req.app.get('keys'), { ...payload, temporary: true }, config.jwtDurations.initialToken)
  const tokenCallback = redirectUrl.origin + req.publicBasePath + '/api/auth/token_callback'
  const tokenCallbackUrl = new URL(tokenCallback)
  tokenCallbackUrl.searchParams.set('id_token', token)
  if (redirect) tokenCallbackUrl.searchParams.set('redirect', redirect)
  if (userOrg) {
    tokenCallbackUrl.searchParams.set('id_token_org', userOrg.id)
    if (userOrg.department) tokenCallbackUrl.searchParams.set('id_token_dep', userOrg.department)
  }
  if (orgStorage) tokenCallbackUrl.searchParams.set('org_storage', 'true')
  return tokenCallbackUrl
}
