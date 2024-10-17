import { Router } from 'express'
import { reqUser } from '@data-fair/lib-express'

const router = export default  Router()

router.get('', async (req, res, next) => {
  if (!reqUser(req)) return res.status(401).send()
  if (!reqUser(req)?.adminMode) return res.status(403).send()
  const oauthTokens = await req.app.get('storage').readOAuthTokens()
  res.send(oauthTokens)
})
