const express = require('express')
const jwt = require('./jwt')
const asyncWrap = require('./utils/async-wrap')

let router = express.Router()

// Get the list of organizations
router.get('', jwt.optionalJwtMiddleware, asyncWrap(async (req, res, next) => {
  let params = {}
  if (req.query) {
    if (req.query['ids']) params.ids = req.query['ids'].split(',')
    if (req.query['is-member'] && req.query['is-member'] === 'true' && req.user) params['has-user'] = req.user.id
    if (req.query.q) params.q = req.query.q
  }
  const organizations = req.user ? await req.app.get('storage').findOrganizations(params) : {results: [], count: 0}
  organizations.results = organizations.results.map(organization => ({id: organization.id, name: organization.name}))
  res.json(organizations)
}))

// Get the list of organization roles
router.get('/:organizationId/roles', jwt.jwtMiddleware, asyncWrap(async (req, res, next) => {
  const userOrganizations = await req.app.get('storage').getUserOrganizations(req.user.id)
  if (!userOrganizations.find(organization => organization.id === req.params.organizationId)) return res.sendStatus(403)
  const roles = await req.app.get('storage').getOrganizationRoles(req.params.organizationId)
  res.json(roles)
}))

module.exports = router
