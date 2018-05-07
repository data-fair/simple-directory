const express = require('express')
const shortid = require('shortid')
const asyncWrap = require('../utils/async-wrap')
const findUtils = require('../utils/find')

let router = module.exports = express.Router()

// Get the list of organizations
router.get('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.send({results: [], count: 0})
  let params = {...findUtils.pagination(req.query)}

  // Only service admins can request to see all field. Other users only see id/name
  const allFields = req.query.allFields === 'true'
  if (allFields && !req.user.isAdmin) return res.status(403).send()
  if (!allFields) params.select = ['id', 'name']

  if (req.query['ids']) params.ids = req.query['ids'].split(',')
  if (req.query.q) params.q = req.query.q

  const organizations = await req.app.get('storage').findOrganizations(params)
  res.json(organizations)
}))

// Get details of an organization
router.get('/:organizationId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only allowed for the organizations that the user belongs to
  if (!req.user.organizations || !req.user.organizations.find(o => o.id === req.params.organizationId)) {
    return res.sendStatus(403)
  }
  const orga = await req.app.get('storage').getOrganization(req.params.organizationId)
  res.send(orga)
}))

// Get the list of organization roles
// TODO: keep temporarily for compatibility.. but later a simpler GET on the orga will be enough
router.get('/:organizationId/roles', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only search through the organizations that the user belongs to
  if (!req.user.organizations || !req.user.organizations.find(o => o.id === req.params.organizationId)) {
    return res.sendStatus(403)
  }
  const orga = await req.app.get('storage').getOrganization(req.params.organizationId)
  res.send(orga.roles || ['admin', 'user'])
}))

// Create an organization
router.post('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  const storage = req.app.get('storage')
  const orga = req.body
  orga.id = orga.id || shortid.generate()
  orga.roles = orga.roles || ['admin', 'user']
  await storage.createOrganization(orga)
  await storage.addMember(orga, req.user, 'admin')
  res.status(201).send(orga)
}))

// Update some parts of an organization as admin of it
const patchKeys = ['name', 'description']
router.patch('/:organizationId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only allowed for the organizations that the user is admin of
  if (!req.user.organizations || !req.user.organizations.find(o => o.id === req.params.organizationId && o.role === 'admin')) {
    return res.sendStatus(403)
  }

  const forbiddenKey = Object.keys(req.body).find(key => !patchKeys.includes(key))
  if (forbiddenKey) return res.status(400).send('Only some parts of the organization can be modified through this route')
  const patchedOrga = await req.app.get('storage').patchOrganization(req.params.organizationId, req.body)
  res.send(patchedOrga)
}))

// Get the members of an organization. i.e. a partial user object (id, name, role).
router.get('/:organizationId/members', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only search through the organizations that the user belongs to
  if (!req.user.organizations || !req.user.organizations.find(o => o.id === req.params.organizationId)) {
    return res.sendStatus(403)
  }
  const params = {...findUtils.pagination(req.query)}
  if (req.query.q) params.q = req.query.q
  const members = await req.app.get('storage').findMembers(req.params.organizationId, params)
  res.send(members)
}))

// Exclude a member of the organization
router.delete('/:organizationId/members/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only allowed for the organizations that the user is admin of
  if (!req.user.organizations || !req.user.organizations.find(o => o.id === req.params.organizationId && o.role === 'admin')) {
    return res.sendStatus(403)
  }
  await req.app.get('storage').removeMember(req.params.organizationId, req.params.userId)
  res.status(204).send()
}))
