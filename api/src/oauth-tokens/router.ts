import { Router } from 'express'
import { reqUser } from '@data-fair/lib-express'
import { readOAuthTokens } from '#services'

const router = Router()
export default router

router.get('', async (req, res, next) => {
  if (!reqUser(req)) return res.status(401).send()
  if (!reqUser(req)?.adminMode) return res.status(403).send()
  res.send(await readOAuthTokens())
})
