const express = require('express')
const asyncWrap = require('../utils/async-wrap')

let router = express.Router()

// Get the list of organizations
router.get('', asyncWrap(async (req, res, next) => {
  let params = {}
  if (req.query) {
    if (req.query['ids']) params.ids = req.query['ids'].split(',')
    if (req.query.q) params.q = req.query.q
  }
  const organizations = req.user ? await req.app.get('storage').findOrganizations(params) : {results: [], count: 0}
  organizations.results = organizations.results.map(organization => ({id: organization.id, name: organization.name}))
  res.json(organizations)
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
  res.json(orga.roles || ['admin', 'user'])
}))

router.get('/:organizationId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only search through the organizations that the user belongs to
  if (!req.user.organizations || !req.user.organizations.find(o => o.id === req.params.organizationId)) {
    return res.sendStatus(403)
  }
  const orga = await req.app.get('storage').getOrganization(req.params.organizationId)
  res.json(orga)
}))

module.exports = router
