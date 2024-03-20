const express = require('express')
const config = require('config')
const Ajv = require('ajv')
const asyncWrap = require('./async-wrap')

const ajv = new Ajv({ strict: false })

const limitTypeSchema = { type: 'object', properties: { limit: { type: 'number' }, consumption: { type: 'number' } } }
const schema = {
  type: 'object',
  required: ['id', 'type', 'lastUpdate'],
  properties: {
    type: { type: 'string' },
    id: { type: 'string' },
    name: { type: 'string' },
    lastUpdate: { type: 'string', format: 'date-time' },
    store_nb_members: limitTypeSchema
  }
}
const validate = ajv.compile(schema)

exports.getLimits = async (db, consumer) => {
  const coll = db.collection('limits')
  let limit = await coll.findOne({ type: consumer.type, id: consumer.id })
  if (!limit || !limit.store_nb_members) {
    limit = {
      type: consumer.type,
      id: consumer.id,
      name: consumer.name || consumer.id,
      lastUpdate: new Date().toISOString(),
      store_nb_members: { limit: config.quotas.defaultMaxNbMembers }
    }
    await coll.replaceOne({ type: consumer.type, id: consumer.id }, limit, { upsert: true })
  }
  if (limit.store_nb_members.consumption === undefined) {
    if (consumer.type === 'organization') limit = await exports.setNbMembers(db, consumer.id)
    else limit.store_nb_members.consumption = 1
  }
  if (limit.store_nb_members.limit === undefined) {
    limit.store_nb_members.limit = config.quotas.defaultMaxNbMembers
  }
  return limit
}

exports.get = async (db, consumer, type) => {
  const limit = await exports.getLimits(db, consumer)
  const res = limit[type]
  res.type = type
  return res
}

exports.incrementConsumption = async (db, consumer, type, inc) => {
  return (await db.collection('limits')
    .findOneAndUpdate({ type: consumer.type, id: consumer.id }, { $inc: { [`${type}.consumption`]: inc } }, { returnDocument: 'after', upsert: true })).value
}

exports.setNbMembers = async (db, organizationId) => {
  const consumer = { type: 'organization', id: organizationId }
  return exports.setConsumption(db, consumer, 'store_nb_members', await db.collection('users').countDocuments({ 'organizations.id': organizationId }))
}

exports.setConsumption = async (db, consumer, type, value) => {
  return (await db.collection('limits')
    .findOneAndUpdate({ type: consumer.type, id: consumer.id }, { $set: { [`${type}.consumption`]: value } }, { returnDocument: 'after', upsert: true })).value
}

exports.updateName = async (db, identity) => {
  await db.collection('limits')
    .updateMany({ type: identity.type, id: identity.id }, { $set: { name: identity.name } })
}

const router = exports.router = express.Router()

const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.adminMode) return next()
  if (req.query.key && req.query.key === config.secretKeys.limits) return next()
  res.status(401).send()
}

const isAccountMember = (req, res, next) => {
  if (req.query.key && req.query.key === config.secretKeys.limits) return next()
  if (!req.user) return res.status(401).send()
  if (req.user.adminMode) return next()
  if (!['organization', 'user'].includes(req.params.type)) return res.status(400).send('Wrong consumer type')
  if (req.params.type === 'user') {
    if (req.user.id !== req.params.id) return res.status(403).send()
  }
  if (req.params.type === 'organization') {
    const org = req.user.organizations.find(o => o.id === req.params.id)
    if (!org) return res.status(403).send()
  }
  next()
}

// Endpoint for customers service to create/update limits
router.post('/:type/:id', isSuperAdmin, asyncWrap(async (req, res, next) => {
  req.body.type = req.params.type
  req.body.id = req.params.id
  const valid = validate(req.body)
  if (!valid) return res.status(400).send(validate.errors)
  await req.app.get('storage').db.collection('limits')
    .replaceOne({ type: req.params.type, id: req.params.id }, req.body, { upsert: true })
  res.send(req.body)
}))

// A user can get limits information for himself only
router.get('/:type/:id', isAccountMember, asyncWrap(async (req, res, next) => {
  const limit = await exports.getLimits(req.app.get('storage').db, { type: req.params.type, id: req.params.id })
  delete limit._id
  res.send(limit)
}))

router.get('/', isSuperAdmin, asyncWrap(async (req, res, next) => {
  const filter = {}
  if (req.query.type) filter.type = req.query.type
  if (req.query.id) filter.id = req.query.id
  const results = await req.app.get('storage').db.collection('limits')
    .find(filter)
    .sort({ lastUpdate: -1 })
    .project({ _id: 0 })
    .limit(10000)
    .toArray()
  res.send({ results, count: results.length })
}))
