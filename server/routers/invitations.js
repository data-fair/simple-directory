const express = require('express')
const config = require('config')
const URL = require('url').URL
const asyncWrap = require('../utils/async-wrap')
const mails = require('../mails')

let router = module.exports = express.Router()

// Invitation for a user to join an organization from an admin of this organization
router.post('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  const invitation = req.body
  const orga = req.user.organizations.find(o => o.id === invitation.id)
  if (!orga) return res.status(403).send()
  invitation.name = orga.name
  await req.app.get('storage').createInvitation(invitation)
  const link = config.publicUrl + '/me'
  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'invitation',
    messages: req.messages,
    to: req.body.email,
    params: {link, host: new URL(link).host, organization: invitation.name}
  })
  res.status(201).send()
}))
