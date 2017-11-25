const express = require('express')
const jwtMiddleware = require('./jwt').jwtMiddleware

let router = express.Router()

// Get the list of users
router.get('', jwtMiddleware, async function(req, res, next) {
  let users = []
  if (!req.query || req.query['ids']) {
    users = await req.app.get('storage').getUsersByIds(req.query['ids'].split(','))
  }
  res.json({
    results: users,
    count: users.length
  })
})

router.get('/:userId', jwtMiddleware, async (req, res, next) => {
  if (req.user.id !== req.params.userId) return res.sendStatus(403)
  const user = await req.app.get('storage').getUserById(req.params.userId)
  if (!user) return res.sendStatus(404)
  res.json(user)
})

module.exports = router
