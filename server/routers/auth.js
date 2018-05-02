const fs = require('fs')
const path = require('path')
const express = require('express')
const jwt = require('jsonwebtoken')
const util = require('util')
const URL = require('url').URL
const asyncWrap = require('../utils/async-wrap')
const userName = require('../utils/user-name')
const mails = require('../mails')

const config = require('config')
const privateKey = fs.readFileSync(path.join(__dirname, '../..', config.secret.private))
const publicKey = fs.readFileSync(path.join(__dirname, '../..', config.secret.public))

let router = exports.router = express.Router()

function getPayload(user) {
  return {
    id: user.id,
    email: user.email,
    name: userName(user),
    organizations: user.organizations
  }
}

// Either find or create an user based on an email address then send a mail with a link and a token
// to check that this address belongs to the user.
router.post('/passwordless', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)

  const user = await req.app.get('storage').getUser({email: req.body.email})
  // No 404 here so we don't disclose information about existence of the user
  if (!user) return res.status(204).send()

  const payload = getPayload(user)
  if (config.admins.includes(req.body.email)) user.isAdmin = true
  if (user.isAdmin) payload.isAdmin = true
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: config.jwt.expiresIn,
    keyid: config.kid
  })
  const link = (req.query.redirect || config.publicUrl + '/me?id_token=') + token
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
    decoded = await util.promisify(jwt.verify)(idToken, publicKey)
  } catch (err) {
    return res.status(401).send('Invalid id_token')
  }

  // User may have new organizations since last renew
  const user = await req.app.get('storage').getUser({id: decoded.id})
  const payload = getPayload(user)

  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: config.jwt.expiresIn,
    keyid: config.kid
  })
  res.cookie('id_token', token)
  res.send(token)
}))
