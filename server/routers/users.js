const express = require('express')
const asyncWrap = require('../utils/async-wrap')
const userName = require('../utils/user-name')

let router = express.Router()

// Get the list of users
router.get('', asyncWrap(async (req, res, next) => {
  let params = {}
  if (req.query) {
    if (req.query['ids']) params.ids = req.query['ids'].split(',')
    if (req.query.q) params.q = req.query.q
  }
  const users = req.user ? await req.app.get('storage').findUsers(params) : {results: [], count: 0}
  users.results = users.results.map(user => ({id: user.id, name: user.name}))
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
  const tempUser = {...req.user, ...patch}
  delete tempUser.name
  patch.name = userName(tempUser)
  console.log('PATCH', patch)
  const patchedUser = await req.app.get('storage').patchUser(req.params.userId, patch)
  res.send(patchedUser)
}))

module.exports = router
