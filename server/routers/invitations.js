const express = require('express')
const config = require('config')
const URL = require('url').URL
const shortid = require('shortid')
const jwt = require('../utils/jwt')
const asyncWrap = require('../utils/async-wrap')
const mails = require('../mails')
const userName = require('../utils/user-name')
const emailValidator = require('email-validator')

let router = module.exports = express.Router()

// Invitation for a user to join an organization from an admin of this organization
router.post('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)

  const invitation = req.body
  const orga = req.user.organizations.find(o => o.id === invitation.id)
  if (!req.user.isAdmin && (!orga || orga.role !== 'admin')) return res.status(403).send(req.messages.errors.permissionDenied)
  const token = jwt.sign(req.app.get('keys'), invitation, config.jwtDurations.invitationToken)

  const link = config.publicUrl + '/api/invitations/_accept?invit_token=' + encodeURIComponent(token)
  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'invitation',
    messages: req.messages,
    to: req.body.email,
    params: { link, host: new URL(link).host, organization: invitation.name }
  })
  res.status(201).send()
}))

router.get('/_accept', asyncWrap(async (req, res, next) => {
  const invit = await jwt.verify(req.app.get('keys'), req.query.invit_token)
  const storage = req.app.get('storage')
  let user = await storage.getUserByEmail(invit.email)
  if (!user && storage.readonly) return res.status(400).send(req.messages.errors.userUnknown)
  if (!user) user = await storage.createUser({ email: invit.email, id: shortid.generate(), name: userName({ email: invit.email }) })
  const orga = await storage.getOrganization(invit.id)
  if (!orga) return res.status(400).send(req.messages.errors.orgaUnknown)
  if (user.organizations && user.organizations.find(o => o.id === invit.id)) return res.status(400).send(req.messages.errors.invitationConflict)
  await storage.addMember(orga, user, invit.role)
  res.redirect(`${config.publicUrl}/invitation?email=` + encodeURIComponent(invit.email))
}))
