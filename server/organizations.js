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

module.exports = router
