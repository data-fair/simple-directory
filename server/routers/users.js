const express = require('express')
const jwt = require('../jwt')
const asyncWrap = require('../utils/async-wrap')
const userName = require('../utils/user-name')

let router = express.Router()

// Get the list of users
router.get('', jwt.optionalJwtMiddleware, asyncWrap(async (req, res, next) => {
  let params = {}
  if (req.query) {
    if (req.query['ids']) params.ids = req.query['ids'].split(',')
    if (req.query.q) params.q = req.query.q
  }
  const users = req.user ? await req.app.get('storage').findUsers(params) : {results: [], count: 0}
  users.results = users.results.map(user => ({id: user.id, name: userName(user)}))
  res.json(users)
}))

router.get('/:userId', jwt.jwtMiddleware, asyncWrap(async (req, res, next) => {
  if (req.user.id !== req.params.userId) return res.sendStatus(403)
  const user = await req.app.get('storage').getUser({id: req.params.userId})
  if (!user) return res.sendStatus(404)
  res.json(user)
}))

module.exports = router
