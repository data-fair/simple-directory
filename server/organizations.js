const express = require('express')
const jwtMiddleware = require('./jwt').jwtMiddleware

let router = express.Router()

// Get the list of organizations
router.get('', jwtMiddleware, async function(req, res, next) {
  let organizations = []
  if (!req.query || req.query['is-member'] === 'true') {
    organizations = await req.app.get('storage').getUserOrganizations(req.user.id)
  } else if (req.query['ids']) {
    organizations = await req.app.get('storage').getOrganizationsByIds(req.query['ids'].split(','))
  }
  res.json({
    results: organizations,
    count: organizations.length
  })
})

module.exports = router
