const express = require('express')
const config = require('config')
const shortid = require('shortid')
const emailValidator = require('email-validator')
const asyncWrap = require('../utils/async-wrap')
const userName = require('../utils/user-name')
const findUtils = require('../utils/find')
const tokens = require('../utils/tokens')
const passwords = require('../utils/passwords')
const webhooks = require('../webhooks')
const mails = require('../mails')
const storages = require('../storages')
const defaultConfig = require('../../config/default.js')

const router = express.Router()

// Get the list of users
router.get('', asyncWrap(async (req, res, next) => {
  if (config.listEntitiesMode === 'authenticated' && !req.user) return res.send({ results: [], count: 0 })
  if (config.listEntitiesMode === 'admin' && !(req.user && req.user.adminMode)) return res.send({ results: [], count: 0 })

  const params = { ...findUtils.pagination(req.query), sort: findUtils.sort(req.query.sort) }

  // Only service admins can request to see all field. Other users only see id/name
  const allFields = req.query.allFields === 'true'
  if (allFields) {
    if (!req.user || !req.user.adminMode) return res.status(403).send(req.messages.errors.permissionDenied)
  } else {
    params.select = ['id', 'name']
  }

  if (req.query) {
    if (req.query.ids) params.ids = req.query.ids.split(',')
    if (req.query.q) params.q = req.query.q
  }
  const users = await req.app.get('storage').findUsers(params)
  res.json(users)
}))

const createKeys = ['firstName', 'lastName', 'email', 'password', 'birthday']
// TODO: block when onlyCreateInvited is true ?
router.post('', asyncWrap(async (req, res, next) => {
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  const invalidKey = Object.keys(req.body).find(key => !createKeys.concat(adminKeys).includes(key))
  if (invalidKey) return res.status(400).send(`Attribute ${invalidKey} is not accepted`)

  const storage = req.app.get('storage')

  // create user
  const newUser = {
    email: req.body.email,
    id: shortid.generate(),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    emailConfirmed: false,
  }
  newUser.name = userName(newUser)

  // password is optional as we support passwordless auth
  if (![undefined, null].includes(req.body.password)) {
    if (!passwords.validate(req.body.password)) {
      return res.status(400).send(req.messages.errors.malformedPassword)
    }
    newUser.password = await passwords.hashPassword(req.body.password)
  }

  // email is already taken, send a conflict email
  const user = await req.app.get('storage').getUserByEmail(req.body.email)
  const link = req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl
  if (user && user.emailConfirmed !== false) {
    const linkUrl = new URL(link)
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'conflict',
      messages: req.messages,
      to: req.body.email,
      params: { host: linkUrl.host, origin: linkUrl.origin },
    })
    return res.status(204).send()
  }

  // Re-create a user that was never validated.. first clean temporary user
  if (user && user.emailConfirmed === false) {
    await storage.deleteUser(user.id)
  }

  await storage.createUser(newUser, null, new URL(link).host)

  // prepare same link and payload as for a passwordless authentication
  // the user will be validated and authenticated at the same time by the exchange route
  const payload = tokens.getPayload(newUser)
  const linkUrl = tokens.prepareCallbackUrl(req, { ...payload, emailConfirmed: true, temporary: true }, req.query.redirect, req.query.org)
  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'creation',
    messages: req.messages,
    to: req.body.email,
    params: { link: linkUrl.href, host: linkUrl.host, origin: linkUrl.origin },
  })

  // this route doesn't return any info to its caller to prevent giving any indication of existing accounts, etc
  return res.status(204).send()
}))

router.get('/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.adminMode && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)
  let storage = req.app.get('storage')
  if (req.user.id === req.params.userId && req.user.orgStorage && req.user.organization) {
    const org = await req.app.get('storage').getOrganization(req.user.organization.id)
    if (!org) return res.status(401).send('Organization does not exist anymore')
    storage = await storages.init(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }
  const user = await storage.getUser({ id: req.params.userId })
  if (!user) return res.status(404).send()
  user.isAdmin = config.admins.includes(user.email)
  user.avatarUrl = req.publicBaseUrl + '/api/avatars/user/' + user.id + '/avatar.png'
  res.json(user)
}))

// Update some parts of a user as himself
const patchKeys = ['firstName', 'lastName', 'birthday']
const adminKeys = ['maxCreatedOrgs', 'email', '2FA']
router.patch('/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.adminMode && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)

  const unpatchableKey = Object.keys(req.body).find(key => !patchKeys.concat(adminKeys).includes(key))
  if (unpatchableKey) return res.status(400).send('Only some parts of the user can be modified through this route')
  const adminKey = Object.keys(req.body).find(key => adminKeys.includes(key))
  if (adminKey && !req.user.adminMode) return res.status(403).send(req.messages.errors.permissionDenied)

  const patch = req.body
  const name = userName({ ...req.user, ...patch }, true)
  if (name !== req.user.name) {
    patch.name = name
    webhooks.postIdentity('user', { ...req.user, ...patch })
  }
  const patchedUser = await req.app.get('storage').patchUser(req.params.userId, patch, req.user)
  if (req.app.get('storage').db) await req.app.get('storage').db.collection('limits').updateOne({ type: 'user', id: patchedUser.id }, { $set: { name: patchedUser.name } })
  patchedUser.avatarUrl = req.publicBaseUrl + '/api/avatars/user/' + patchedUser.id + '/avatar.png'

  // update session info
  await tokens.keepalive(req, res)

  res.send(patchedUser)
}))

// Only super admin can delete a user for now
router.delete('/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (config.userSelfDelete) {
    if (!req.user.adminMode && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)
  } else {
    if (!req.user.adminMode) return res.status(403).send(req.messages.errors.permissionDenied)
  }

  await req.app.get('storage').deleteUser(req.params.userId)
  webhooks.deleteIdentity('user', req.params.userId)
  res.status(204).send()
}))

// Change password of a user using an action token sent in a mail
router.post('/:userId/password', asyncWrap(async (req, res, next) => {
  if (!req.body.password) return res.status(401).send()
  const actionToken = req.query.action_token
  if (!actionToken) return res.status(401).send()
  let decoded
  try {
    decoded = await tokens.verify(req.app.get('keys'), actionToken)
  } catch (err) {
    return res.status(401).send(req.messages.errors.invalidToken)
  }
  if (decoded.id !== req.params.userId) return res.status(401).send()
  if (decoded.action !== 'changePassword') return res.status(401).send()
  if (!passwords.validate(req.body.password)) return res.status(400).send(req.messages.errors.malformedPassword)
  const storedPassword = await passwords.hashPassword(req.body.password)
  await req.app.get('storage').patchUser(req.params.userId, { password: storedPassword })
  res.status(204).send()
}))

module.exports = router
