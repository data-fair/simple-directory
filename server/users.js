const express = require('express')
const jwtMiddleware = require('./jwt').jwtMiddleware

let router = express.Router()

router.get('/:userId', jwtMiddleware, async (req, res, next) => {
  if (req.user.id !== req.params.userId) return res.sendStatus(403)
  const user = await req.app.get('storage').getUserById(req.params.userId)
  if (!user) return res.sendStatus(404)
  res.json(user)
})

module.exports = router
