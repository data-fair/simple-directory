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
const debug = require('debug')('invitations')

let router = module.exports = express.Router()

// Invitation for a user to join an organization from an admin of this organization
router.post('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  debug('new invitation', req.body)
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
  const params = { link: linkUrl.href, organization: invitation.name, host: linkUrl.host, origin: linkUrl.origin }
  await mails.send({
    transport: req.app.get('mailTransport'),
    key: 'invitation',
    messages: req.messages,
    to: req.body.email,
    params
  })

  if (req.user.adminMode || req.user.asAdmin) {
    return res.send(params)
  }
  res.status(201).send()
}))

router.get('/_accept', asyncWrap(async (req, res, next) => {
  let invit
  let verified
  const errorUrl = new URL(`${config.publicUrl}/login`)
  try {
    invit = await jwt.verify(req.app.get('keys'), req.query.invit_token)
    verified = true
  } catch (err) {
    if (err.name !== 'TokenExpiredError') {
      debug('invalid invitation', err)
      errorUrl.searchParams.set('error', 'invalidInvitationToken')
      return res.redirect(errorUrl.href)
    } else {
      debug('old invalid invitation accepted only to present good redirect to the user')
    }
    // if the token was once valid, but deprecated we accept it partially
    // meaning that we will not perform writes base on it
    // but we accept to check the user's existence and create the best redirect for him
    invit = jwt.decode(req.query.invit_token)
    verified = false
  }
  debug('accept invitation', invit, verified)
  const storage = req.app.get('storage')

  let user = await storage.getUserByEmail(invit.email)
  if (!user && storage.readonly) {
    errorUrl.searchParams.set('error', 'userUnknown')
    return res.redirect(errorUrl.href)
  }

  const orga = await storage.getOrganization(invit.id)
  if (!orga) {
    errorUrl.searchParams.set('error', 'orgaUnknown')
    return res.redirect(errorUrl.href)
  }

  let redirectUrl = new URL(invit.redirect || config.invitationRedirect || `${config.publicUrl}/invitation`)
  redirectUrl.searchParams.set('email', invit.email)
  redirectUrl.searchParams.set('id_token_org', invit.id)

  // case where the invitation was already accepted, but we still want the user to proceed
  if (user && user.organizations && user.organizations.find(o => o.id === invit.id)) {
    debug('invitation was already accepted, redirect', redirectUrl.href)
    // missing password, invitation must have been accepted without completing account creation
    if (!await storage.hasPassword(invit.email) && !config.passwordless) {
      const payload = jwt.getPayload(user)
      payload.action = 'changePassword'
      const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
      const reboundRedirect = redirectUrl.href
      redirectUrl = new URL(`${config.publicUrl}/login`)
      redirectUrl.searchParams.set('step', 'changePassword')
      redirectUrl.searchParams.set('email', invit.email)
      redirectUrl.searchParams.set('id_token_org', invit.id)
      redirectUrl.searchParams.set('action_token', token)
      redirectUrl.searchParams.set('redirect', reboundRedirect)
      debug('redirect to changePassword step', redirectUrl.href)
      return res.redirect(redirectUrl.href)
    }
    if (!req.user || req.user.email !== invit.email) {
      const reboundRedirect = redirectUrl.href
      redirectUrl = new URL(`${config.publicUrl}/login`)
      redirectUrl.searchParams.set('email', invit.email)
      redirectUrl.searchParams.set('id_token_org', invit.id)
      redirectUrl.searchParams.set('redirect', reboundRedirect)
      debug('redirect to login', redirectUrl.href)
      return res.redirect(redirectUrl.href)
    }
    return res.redirect(redirectUrl.href)
  }
  if (!verified) {
    errorUrl.searchParams.set('error', 'expiredInvitationToken')
    return res.redirect(errorUrl.href)
  }

  if (storage.db) {
    const consumer = { type: 'organization', id: orga.id }
    const limit = await limits.get(storage.db, consumer, 'store_nb_members')
    if (limit.consumption >= limit.limit && limit.limit > 0) {
      errorUrl.searchParams.set('error', 'maxNbMembers')
      return res.redirect(errorUrl.href)
    }
  }

  if (!user) {
    const userInit = { email: invit.email, id: shortid.generate(), name: userName({ email: invit.email }), emailConfirmed: true }
    if (invit.department) userInit.department = invit.department
    debug('create invited user', userInit)
    user = await storage.createUser(userInit)
    if (!config.passwordless) {
      const payload = jwt.getPayload(user)
      payload.action = 'changePassword'
      const token = jwt.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
      const reboundRedirect = redirectUrl.href
      redirectUrl = new URL(`${config.publicUrl}/login`)
      redirectUrl.searchParams.set('step', 'changePassword')
      redirectUrl.searchParams.set('email', invit.email)
      redirectUrl.searchParams.set('id_token_org', invit.id)
      redirectUrl.searchParams.set('action_token', token)
      redirectUrl.searchParams.set('redirect', reboundRedirect)
      debug('redirect new user to changePassword step', redirectUrl.href)
    }
  }

  await storage.addMember(orga, user, invit.role, invit.department)
  if (storage.db) {
    await limits.setNbMembers(storage.db, orga.id)
  }
  res.redirect(redirectUrl.href)
}))
