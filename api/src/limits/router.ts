import config from '#config'
import { Router } from 'express'
import { reqUser } from '@data-fair/lib-express'

const router = Router()

const isSuperAdmin = (req, res, next) => {
  if (reqUser(req)?.adminMode) return next()
  if (req.query.key && req.query.key === config.secretKeys.limits) return next()
  res.status(401).send()
}

const isAccountMember = (req, res, next) => {
  if (req.query.key && req.query.key === config.secretKeys.limits) return next()
  if (!reqUser(req)) return res.status(401).send()
  if (reqUser(req)?.adminMode) return next()
  if (!['organization', 'user'].includes(req.params.type)) return res.status(400).send('Wrong consumer type')
  if (req.params.type === 'user') {
    if (reqUser(req).id !== req.params.id) return res.status(403).send()
  }
  if (req.params.type === 'organization') {
    const org = reqUser(req).organizations.find(o => o.id === req.params.id)
    if (!org) return res.status(403).send()
  }
  next()
}

// Endpoint for customers service to create/update limits
router.post('/:type/:id', isSuperAdmin, async (req, res, next) => {
  req.body.type = req.params.type
  req.body.id = req.params.id
  const valid = validate(req.body)
  if (!valid) return res.status(400).send(validate.errors)
  await storages.globalStorage.mongo.limits
    .replaceOne({ type: req.params.type, id: req.params.id }, req.body, { upsert: true })
  res.send(req.body)
})

// A user can get limits information for himself only
router.get('/:type/:id', isAccountMember, async (req, res, next) => {
  const limit = await export const  getLimits(storages.globalStorage.{ type: req.params.type, id: req.params.id })
  delete limit._id
  res.send(limit)
})

router.get('/', isSuperAdmin, async (req, res, next) => {
  const filter = {}
  if (req.query.type) filter.type = req.query.type
  if (req.query.id) filter.id = req.query.id
  const results = await storages.globalStorage.mongo.limits
    .find(filter)
    .sort({ lastUpdate: -1 })
    .project({ _id: 0 })
    .limit(10000)
    .toArray()
  res.send({ results, count: results.length })
})
