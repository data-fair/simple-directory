import { Router } from 'express'
import { reqUser } from '@data-fair/lib-express'
import { readOAuthTokens } from '#services'

const router = Router()
export default router

router.get('', async (req, res, next) => {
  if (!reqUser(req)) return res.status(401).send()
  if (!reqUser(req)?.adminMode) throw httpError(403, )
  res.send(await readOAuthTokens())
})
