import config from '#config'
import { Router, type RequestHandler } from 'express'
import { reqUser, reqSessionAuthenticated, assertAccountRole, httpError } from '@data-fair/lib-express'
import * as limitsSchema from '#types/limits/index.ts'
import { getOrgLimits } from '#services'
import mongo from '#mongo'
import storages from '#storages'

const router = Router()
export default router

const isSuperAdmin: RequestHandler = (req, res, next) => {
  if (reqUser(req)?.adminMode) return next()
  if (req.query.key && req.query.key === config.secretKeys.limits) return next()
  res.status(401).send()
}

const isUser: RequestHandler = (req, res, next) => {
  if (req.query.key && req.query.key === config.secretKeys.limits) return next()
  const session = reqSessionAuthenticated(req)
  assertAccountRole(session, { type: 'user', id: req.params.id }, 'admin')
  next()
}

const isAccountMember: RequestHandler = (req, res, next) => {
  if (req.query.key && req.query.key === config.secretKeys.limits) return next()
  const session = reqSessionAuthenticated(req)
  assertAccountRole(session, { type: 'organization', id: req.params.id }, 'admin', { acceptDepAsRoot: config.depAdminIsOrgAdmin })
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

// A user can get limits information for his org
router.get('/organization/:id', isAccountMember, async (req, res, next) => {
  const org = await storages.globalStorage.getOrganization(req.params.id)
  if (!org) throw httpError(404)
  res.send(await getOrgLimits(org))
})
router.get('/user/:id', isUser, async (req, res, next) => {
  const user = await storages.globalStorage.getUser(req.params.id)
  if (!user) throw httpError(404)
  res.send({
    type: 'user',
    id: user.id,
    name: user.name,
    lastUpdate: new Date().toISOString(),
    store_nb_members: { limit: 1, consumption: 1 }
  })
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
