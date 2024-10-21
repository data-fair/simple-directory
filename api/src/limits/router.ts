import config from '#config'
import { Router, type Request, type Response, type NextFunction } from 'express'
import { reqUser, reqSessionAuthenticated, assertAccountRole, httpError, type Account } from '@data-fair/lib-express'
import * as limitsSchema from '#types/limits/index.ts'
import mongo from '#mongo'

const router = Router()
export default router

const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (reqUser(req)?.adminMode) return next()
  if (req.query.key && req.query.key === config.secretKeys.limits) return next()
  res.status(401).send()
}

const isAccountMember = (req: Request, res: Response, next: NextFunction) => {
  if (req.query.key && req.query.key === config.secretKeys.limits) return next()
  const session = reqSessionAuthenticated(req)
  assertAccountRole(session, req.params as unknown as Account, 'admin', { acceptDepAsRoot: config.depAdminIsOrgAdmin })
  next()
}

// Endpoint for customers service to create/update limits
router.post('/:type/:id', isSuperAdmin, async (req, res, next) => {
  req.body.type = req.params.type
  req.body.id = req.params.id
  const limits = limitsSchema.returnValid(req.body)
  await mongo.limits
    .replaceOne({ type: req.params.type, id: req.params.id }, limits, { upsert: true })
  res.send(limits)
})

// A user can get limits information for himself only
router.get('/:type/:id', isAccountMember, async (req, res, next) => {
  const limits = await mongo.limits.findOne({ type: req.params.type, id: req.params.id }, { projection: { _id: 0 } })
  if (!limits) return httpError(404)
  res.send(limits)
})

router.get('/', isSuperAdmin, async (req, res, next) => {
  const filter = { type: req.query.type, id: req.query.id }
  const results = await mongo.limits
    .find(filter)
    .sort({ lastUpdate: -1 })
    .project({ _id: 0 })
    .limit(10000)
    .toArray()
  res.send({ results, count: results.length })
})
