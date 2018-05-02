const express = require('express')
const jwt = require('../jwt')
const asyncWrap = require('../utils/async-wrap')

let router = express.Router()

// Get the list of organizations
router.get('', jwt.optionalJwtMiddleware, asyncWrap(async (req, res, next) => {
  let params = {}
  if (req.query) {
    if (req.query['ids']) params.ids = req.query['ids'].split(',')
    if (req.query['is-member'] && req.query['is-member'] === 'true' && req.user) params.member = req.user.id
    if (req.query.q) params.q = req.query.q
  }
  const organizations = req.user ? await req.app.get('storage').findOrganizations(params) : {results: [], count: 0}
  organizations.results = organizations.results.map(organization => ({id: organization.id, name: organization.name}))
  res.json(organizations)
}))

// Get the list of organization roles
// TODO: keep temporarily for compatibility.. but later a simpler GET on the orga will be enough
router.get('/:organizationId/roles', jwt.jwtMiddleware, asyncWrap(async (req, res, next) => {
  // Only search through the organizations that the user belongs to
  const orgas = await req.app.get('storage').findOrganizations({member: req.user.id, ids: [req.params.organizationId]})
  if (orgas.count === 0) return res.sendStatus(403)
  res.json(orgas.results[0].roles || ['admin', 'user'])
}))

router.get('/:organizationId', jwt.jwtMiddleware, asyncWrap(async (req, res, next) => {
  // Only search through the organizations that the user belongs to
  const orgas = await req.app.get('storage').findOrganizations({member: req.user.id, ids: [req.params.organizationId]})
  if (orgas.count === 0) return res.sendStatus(403)
  res.json(orgas.results[0])
}))

module.exports = router
