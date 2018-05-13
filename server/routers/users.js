const express = require('express')
const asyncWrap = require('../utils/async-wrap')
const userName = require('../utils/user-name')
const findUtils = require('../utils/find')
const webhooks = require('../webhooks')

let router = express.Router()

// Get the list of users
router.get('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.send({results: [], count: 0})
  let params = {...findUtils.pagination(req.query), sort: findUtils.sort(req.query.sort)}

  // Only service admins can request to see all field. Other users only see id/name
  const allFields = req.query.allFields === 'true'
  if (allFields && !req.user.isAdmin) return res.status(403).send()
  if (!allFields) params.select = ['id', 'name']

  if (req.query) {
    if (req.query['ids']) params.ids = req.query['ids'].split(',')
    if (req.query.q) params.q = req.query.q
  }
  const users = await req.app.get('storage').findUsers(params)
  res.json(users)
}))

router.get('/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (req.user.id !== req.params.userId) return res.status(403).send()
  const user = await req.app.get('storage').getUser({id: req.params.userId})
  if (!user) return res.status(404).send()
  res.json(user)
}))

// Update some parts of a user as himself
const patchKeys = ['firstName', 'lastName']
router.patch('/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (req.user.id !== req.params.userId) return res.status(403).send()

  const forbiddenKey = Object.keys(req.body).find(key => !patchKeys.includes(key))
  if (forbiddenKey) return res.status(400).send('Only some parts of the user can be modified through this route')

  const patch = req.body
  const name = userName({...req.user, ...patch}, true)
  if (name !== req.user.name) {
    patch.name = name
    webhooks.sensUsersWebhooks([{...req.user, ...patch}])
  }
  const patchedUser = await req.app.get('storage').patchUser(req.params.userId, patch, req.user)
  res.send(patchedUser)
}))

// Only super admin can delete a user for now
router.delete('/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.isAdmin) return res.status(403).send()
  await req.app.get('storage').deleteUser(req.params.userId)
  res.status(204).send()
}))

module.exports = router
