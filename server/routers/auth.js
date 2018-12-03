const express = require('express')
const jwt = require('../utils/jwt')
const URL = require('url').URL
const shortid = require('shortid')
const emailValidator = require('email-validator')
const asyncWrap = require('../utils/async-wrap')
const userName = require('../utils/user-name')
const mails = require('../mails')
const passwords = require('../utils/passwords')
const config = require('config')

let router = exports.router = express.Router()

function getPayload(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organizations: user.organizations,
    isAdmin: config.admins.includes(user.email)
  }
}

// Either find or create an user based on an email address then send a mail with a link and a token
// to check that this address belongs to the user.
router.post('/passwordless', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)

  const storage = req.app.get('storage')
  let user = await storage.getUserByEmail(req.body.email)
  // No 404 here so we don't disclose information about existence of the user
  if (!user && (storage.readonly || (config.onlyCreateInvited && !config.admins.includes(req.body.email)))) {
    const link = req.query.redirect || config.defaultLoginRedirect || config.publicUrl
    const linkUrl = new URL(link)
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'noCreation',
      messages: req.messages,
      to: req.body.email,
      params: { link, host: linkUrl.host, origin: linkUrl.origin }
    })
    return res.status(204).send()
  }
  if (!user) {
    const newUser = {
      email: req.body.email,
      id: shortid.generate()
    }
    newUser.name = userName(newUser)
    user = await storage.createUser(newUser)
  }

  const payload = getPayload(user)
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
  const link = (req.query.redirect || config.defaultLoginRedirect || config.publicUrl + '/me?id_token=') + encodeURIComponent(token)
  const linkUrl = new URL(link)
  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'login',
    messages: req.messages,
    to: user.email,
    params: { link, host: linkUrl.host, origin: linkUrl.origin }
  })
  res.status(204).send()
}))

// Used to extend an older but still valid token from a user or to validate a passwordless id_token
router.post('/exchange', asyncWrap(async (req, res, next) => {
  const idToken = (req.cookies && req.cookies.id_token) || (req.headers && req.headers.authorization && req.headers.authorization.split(' ').pop())
  if (!idToken) {
    return res.status(401).send('No id_token cookie provided')
  }
  let decoded
  try {
    decoded = await jwt.verify(req.app.get('keys'), idToken)
  } catch (err) {
    return res.status(401).send('Invalid id_token')
  }

  // User may have new organizations since last renew
  const storage = req.app.get('storage')
  const user = await storage.getUser({ id: decoded.id })
  if (!user) return res.status(401).send('User does not exist anymore')
  const payload = getPayload(user)
  if (!storage.readonly) await storage.updateLogged(decoded.id)

  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.exchangedToken)
  res.send(token)
}))

// Authenticate a user base on his email address and password
router.post('/password', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  if (!req.body.password) return res.status(400).send(req.messages.errors.badCredentials)

  const storage = req.app.get('storage')
  const user = await storage.getUserByEmail(req.body.email)
  if (!user) return res.status(400).send(req.messages.errors.badCredentials)
  const storedPassword = await storage.getPassword(user.id)
  const validPassword = await passwords.checkPassword(req.body.password, storedPassword)
  if (!validPassword) return res.status(400).send(req.messages.errors.badCredentials)
  const payload = getPayload(user)
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
  const link = (req.query.redirect || config.defaultLoginRedirect || config.publicUrl + '/me?id_token=') + encodeURIComponent(token)
  res.send(link)
}))

// Send an email to confirm user identity before authorizing an action
router.post('/action', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  if (!req.body.action) return res.status(400).send(req.messages.errors.badCredentials)

  const storage = req.app.get('storage')
  let user = await storage.getUserByEmail(req.body.email)
  // No 404 here so we don't disclose information about existence of the user
  if (!user && (storage.readonly || (config.onlyCreateInvited && !config.admins.includes(req.body.email)))) {
    const link = req.query.redirect || config.defaultLoginRedirect || config.publicUrl
    const linkUrl = new URL(link)
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'noCreation',
      messages: req.messages,
      to: req.body.email,
      params: { link, host: linkUrl.host, origin: linkUrl.origin }
    })
    return res.status(204).send()
  }
  if (!user) {
    const newUser = {
      email: req.body.email,
      id: shortid.generate()
    }
    newUser.name = userName(newUser)
    user = await storage.createUser(newUser)
  }

  const payload = getPayload(user)
  payload.action = req.body.action
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
  const linkUrl = new URL(req.body.target || config.publicUrl + '/login')
  linkUrl.searchParams.set('action_token', encodeURIComponent(token))

  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'action',
    messages: req.messages,
    to: user.email,
    params: { link: linkUrl.href, host: linkUrl.host, origin: linkUrl.origin }
  })
  res.status(204).send()
}))
