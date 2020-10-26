const express = require('express')
const config = require('config')
const URL = require('url').URL
const shortid = require('shortid')
const jwt = require('../utils/jwt')
const asyncWrap = require('../utils/async-wrap')
const mails = require('../mails')
const userName = require('../utils/user-name')
const limits = require('../utils/limits')
const emailValidator = require('email-validator')

let router = module.exports = express.Router()

// Invitation for a user to join an organization from an admin of this organization
router.post('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  const storage = req.app.get('storage')
  if (storage.db) {
    const limit = await limits.get(storage.db, { type: 'organization', id: req.body.id }, 'store_nb_members')
    if (limit.consumption >= limit.limit && limit.limit > 0) {
      return res.status(429).send(`L'organisation contient déjà le nombre maximal de membres autorisé par ses quotas.`)
    }
  }

  const invitation = req.body
  const orga = req.user.organizations.find(o => o.id === invitation.id)
  if (!req.user.isAdmin && (!orga || orga.role !== 'admin')) return res.status(403).send(req.messages.errors.permissionDenied)
  const token = jwt.sign(req.app.get('keys'), invitation, config.jwtDurations.invitationToken)

  const linkUrl = new URL(config.publicUrl + '/api/invitations/_accept')
  linkUrl.searchParams.set('invit_token', token)
  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'invitation',
    messages: req.messages,
    to: req.body.email,
    params: { link: linkUrl.href, organization: invitation.name, host: linkUrl.host, origin: linkUrl.origin }
  })
  res.status(201).send()
}))

router.get('/_accept', asyncWrap(async (req, res, next) => {
  const invit = await jwt.verify(req.app.get('keys'), req.query.invit_token)
  const storage = req.app.get('storage')

  let user = await storage.getUserByEmail(invit.email)
  if (!user && storage.readonly) return res.status(400).send(req.messages.errors.userUnknown)

  let redirectUrl = new URL(req.query.redirect || config.invitationRedirect || `${config.publicUrl}/invitation`)
  redirectUrl.searchParams.set('email', invit.email)
  redirectUrl.searchParams.set('id_token_org', invit.id)

  const orga = await storage.getOrganization(invit.id)
  if (!orga) return res.status(400).send(req.messages.errors.orgaUnknown)

  const consumer = { type: 'organization', id: orga.id }
  if (storage.db) {
    const limit = await limits.get(storage.db, consumer, 'store_nb_members')
    if (limit.consumption >= limit.limit && limit.limit > 0) {
      return res.status(429).send(`L'organisation contient déjà le nombre maximal de membres autorisé par ses quotas.`)
    }
  }

  if (!user) {
    const userInit = { email: invit.email, id: shortid.generate(), name: userName({ email: invit.email }), emailConfirmed: true }
    if (invit.department) userInit.department = invit.department
    user = await storage.createUser(userInit)
    if (!config.passwordless) {
      const payload = jwt.getPayload(user)
      payload.action = 'changePassword'
      const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
      const reboundRedirect = redirectUrl.href
      redirectUrl = new URL(`${config.publicUrl}/login`)
      redirectUrl.searchParams.set('step', 'changePassword')
      redirectUrl.searchParams.set('email', invit.email)
      redirectUrl.searchParams.set('action_token', token)
      redirectUrl.searchParams.set('redirect', reboundRedirect)
    }
  }

  if (user.organizations && user.organizations.find(o => o.id === invit.id)) {
    // nothing to do, just redirect the user, accepting twice an invitation is not a problem
    // return res.status(400).send(req.messages.errors.invitationConflict)
  } else {
    await storage.addMember(orga, user, invit.role, invit.department)
    if (storage.db) {
      await limits.setNbMembers(storage.db, orga.id)
    }
  }
  res.redirect(redirectUrl.href)
}))
