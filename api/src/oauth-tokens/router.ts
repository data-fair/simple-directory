import { Router } from 'express'

const router = module.exports = Router()

router.get('', async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.adminMode) return res.status(403).send()
  const oauthTokens = await req.app.get('storage').readOAuthTokens()
  res.send(oauthTokens)
})
