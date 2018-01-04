const express = require('express')
const jwt = require('./jwt')

let router = express.Router()

// Get the list of users
router.get('', jwt.optionalJwtMiddleware, async function(req, res, next) {
  let params = {}
  if (req.query) {
    if (req.query['ids']) params.ids = req.query['ids'].split(',')
    if (req.query.q) params.q = req.query.q
  }
  const users = req.user ? await req.app.get('storage').findUsers(params) : {results: [], count: 0}
  users.results = users.results.map(user => ({id: user.id, name: user.firstName + ' ' + user.lastName}))
  res.json(users)
})

router.get('/:userId', jwt.jwtMiddleware, async (req, res, next) => {
  if (req.user.id !== req.params.userId) return res.sendStatus(403)
  const user = await req.app.get('storage').getUserById(req.params.userId)
  if (!user) return res.sendStatus(404)
  res.json(user)
})

module.exports = router
