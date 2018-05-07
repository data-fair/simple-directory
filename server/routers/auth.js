const express = require('express')
const jwt = require('../utils/jwt')
const URL = require('url').URL
const shortid = require('shortid')
const asyncWrap = require('../utils/async-wrap')
const userName = require('../utils/user-name')
const mails = require('../mails')

const config = require('config')

let router = exports.router = express.Router()

function getPayload(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    organizations: user.organizations,
    isAdmin: user.isAdmin
  }
}

// Either find or create an user based on an email address then send a mail with a link and a token
// to check that this address belongs to the user.
router.post('/passwordless', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  const storage = req.app.get('storage')
  let user = await storage.getUser({email: req.body.email})
  // No 404 here so we don't disclose information about existence of the user
  if (!user && storage.readonly) return res.status(204).send()
  if (!user) {
    const newUser = {
      email: req.body.email,
      id: shortid.generate(),
      isAdmin: config.admins.includes(req.body.email)
    }
    newUser.name = userName(newUser)
    user = await storage.createUser(newUser)
  }

  const payload = getPayload(user)
  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
  const link = (req.query.redirect || config.publicUrl + '/me?id_token=') + encodeURIComponent(token)
  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'login',
    messages: req.messages,
    to: req.body.email,
    params: {link, host: new URL(link).host}
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
  const user = await req.app.get('storage').getUser({id: decoded.id})
  if (!user) return res.status(401).send('User does not exist anymore')
  const payload = getPayload(user)

  const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.exhangedToken)
  res.send(token)
}))
