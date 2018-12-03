const express = require('express')
const config = require('config')
const asyncWrap = require('../utils/async-wrap')
const userName = require('../utils/user-name')
const findUtils = require('../utils/find')
const jwt = require('../utils/jwt')
const passwords = require('../utils/passwords')
const webhooks = require('../webhooks')

let router = express.Router()

// Get the list of users
router.get('', asyncWrap(async (req, res, next) => {
  if (config.listEntitiesMode === 'authenticated' && !req.user) return res.send({ results: [], count: 0 })
  if (config.listEntitiesMode === 'admin' && !(req.user && req.user.isAdmin)) return res.send({ results: [], count: 0 })

  let params = { ...findUtils.pagination(req.query), sort: findUtils.sort(req.query.sort) }

  // Only service admins can request to see all field. Other users only see id/name
  const allFields = req.query.allFields === 'true'
  if (allFields) {
    if (!req.user || !req.user.isAdmin) return res.status(403).send(req.messages.errors.permissionDenied)
  } else {
    params.select = ['id', 'name']
  }

  if (req.query) {
    if (req.query['ids']) params.ids = req.query['ids'].split(',')
    if (req.query.q) params.q = req.query.q
  }
  const users = await req.app.get('storage').findUsers(params)
  res.json(users)
}))

router.get('/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.isAdmin && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)
  const user = await req.app.get('storage').getUser({ id: req.params.userId })
  if (!user) return res.status(404).send()
  user.isAdmin = config.admins.includes(user.email)
  res.json(user)
}))

// Update some parts of a user as himself
const patchKeys = ['firstName', 'lastName']
const adminKeys = ['maxCreatedOrgs']
router.patch('/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.isAdmin && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)

  const unpatchableKey = Object.keys(req.body).find(key => !patchKeys.concat(adminKeys).includes(key))
  if (unpatchableKey) return res.status(400).send('Only some parts of the user can be modified through this route')
  const adminKey = Object.keys(req.body).find(key => adminKeys.includes(key))
  if (adminKey && !req.user.isAdmin) return res.status(403).send(req.messages.errors.permissionDenied)

  const patch = req.body
  const name = userName({ ...req.user, ...patch }, true)
  if (name !== req.user.name) {
    patch.name = name
    webhooks.sendUsersWebhooks([{ ...req.user, ...patch }])
  }
  const patchedUser = await req.app.get('storage').patchUser(req.params.userId, patch, req.user)
  res.send(patchedUser)
}))

// Only super admin can delete a user for now
router.delete('/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.isAdmin) return res.status(403).send(req.messages.errors.permissionDenied)
  await req.app.get('storage').deleteUser(req.params.userId)
  res.status(204).send()
}))

// Change password of a user using an action token sent in a mail
router.post('/:userId/password', asyncWrap(async (req, res, next) => {
  if (!req.body.password) return res.status(401).send()
  const actionToken = req.query.action_token
  if (!actionToken) return res.status(401).send()
  let decoded
  try {
    decoded = await jwt.verify(req.app.get('keys'), actionToken)
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
