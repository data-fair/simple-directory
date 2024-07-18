const express = require('express')
const asyncWrap = require('../utils/async-wrap')

const router = module.exports = express.Router()

router.get('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.adminMode) return res.status(403).send()
  const oauthTokens = await req.app.get('storage').readOAuthTokens()
  res.send(oauthTokens)
}))
