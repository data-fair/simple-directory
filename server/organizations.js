const express = require('express')
const jwt = require('./jwt')

let router = express.Router()

// Get the list of organizations
router.get('', jwt.optionalJwtMiddleware, async function(req, res, next) {
  let params = {}
  if (req.query) {
    if (req.query['ids']) params.ids = req.query['ids'].split(',')
    if (req.query['is-member'] && req.user) params['has-user'] = req.user.id
  }
  const organizations = req.user ? await req.app.get('storage').findOrganizations(params) : {results: [], count: 0}
  organizations.results = organizations.results.map(user => ({id: user.id, name: user.firstName + ' ' + user.lastName}))
  res.json(organizations)
})

// Get the list of organization roles
router.get('/:organizationId/roles', jwt.jwtMiddleware, async function(req, res, next) {
  const userOrganizations = await req.app.get('storage').getUserOrganizations(req.user.id)
  if (!userOrganizations.find(organization => organization.id === req.params.organizationId)) return res.sendStatus(403)
  const roles = await req.app.get('storage').getOrganizationRoles(req.params.organizationId)
  res.json(roles)
})

module.exports = router
