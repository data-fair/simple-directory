const express = require('express')
const config = require('config')
const shortid = require('shortid')
const URL = require('url').URL
const tokens = require('../utils/tokens')
const asyncWrap = require('../utils/async-wrap')
const mails = require('../mails')
const userName = require('../utils/user-name')
const limits = require('../utils/limits')
const { shortenInvit, unshortenInvit } = require('../utils/invitations')
const { send: sendNotification } = require('../utils/notifications')
const webhooks = require('../webhooks')
const emailValidator = require('email-validator')
const debug = require('debug')('invitations')

const router = module.exports = express.Router()

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
      return res.status(429).send('L\'organisation contient déjà le nombre maximal de membres autorisé par ses quotas.')
    }
  }

  const invitation = req.body
  const userOrga = req.user.organizations.find(o => o.id === invitation.id)
  if (config.depAdminIsOrgAdmin) {
    if (!req.user.isAdmin && (!userOrga || userOrga.role !== 'admin')) {
      return res.status(403).send(req.messages.errors.permissionDenied)
    }
  } else {
    if (!req.user.isAdmin && (!userOrga || userOrga.role !== 'admin' || (userOrga.department && userOrga.department !== invitation.department))) {
      return res.status(403).send(req.messages.errors.permissionDenied)
    }
  }

  const orga = await storage.getOrganization(invitation.id)

  const token = tokens.sign(req.app.get('keys'), shortenInvit(invitation), config.jwtDurations.invitationToken)

  if (config.alwaysAcceptInvitation) {
    // in 'always accept invitation' mode the user is not sent an email to accept the invitation
    // he is simple added to the list of members and created if needed
    const user = await storage.getUserByEmail(invitation.email)
    if (user && user.emailConfirmed) {
      debug('in alwaysAcceptInvitation and the user already exists, immediately add it as member', invitation.email)
      await storage.addMember(orga, user, invitation.role, invitation.department)
      if (storage.db) await limits.setNbMembers(storage.db, orga.id)
      sendNotification({
        sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invitation.department },
        topic: { key: 'simple-directory:invitation-sent' },
        title: req.__all('notifications.sentInvitation', { email: req.body.email, orgName: orga.name + (invitation.department ? ' / ' + invitation.department : '') })
      })
    } else {
      const newUser = {
        email: invitation.email,
        id: user ? user.id : shortid.generate(),
        organizations: user ? user.organizations : [],
        emailConfirmed: false,
        defaultOrg: orga.id,
        ignorePersonalAccount: true
      }
      newUser.name = userName(newUser)
      debug('in alwaysAcceptInvitation and the user does not exist, create it', newUser)
      await storage.createUser(newUser, req.user)
      await storage.addMember(orga, newUser, invitation.role, invitation.department)
      if (storage.db) await limits.setNbMembers(storage.db, orga.id)
      const reboundRedirect = new URL(invitation.redirect || config.invitationRedirect || `${req.publicBaseUrl}/invitation`)
      const linkUrl = new URL(`${req.publicBaseUrl}/login`)
      linkUrl.searchParams.set('step', 'createUser')
      linkUrl.searchParams.set('invit_token', token)
      linkUrl.searchParams.set('redirect', reboundRedirect.href)
      debug('send email with link to createUser step', linkUrl.href)
      const params = { link: linkUrl.href, organization: invitation.name, host: linkUrl.host, origin: linkUrl.origin }
      await mails.send({
        transport: req.app.get('mailTransport'),
        key: 'invitation',
        messages: req.messages,
        to: req.body.email,
        params
      })

      const notif = {
        sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invitation.department },
        topic: { key: 'simple-directory:add-member' },
        title: req.__all('notifications.addMember', { name: newUser.name, email: newUser.email, orgName: orga.name + (invitation.department ? ' / ' + invitation.department : '') })
      }
      // send notif to all admins subscribed to the topic
      sendNotification(notif)
      // send same notif to user himself
      sendNotification({
        ...notif,
        recipient: { id: newUser.id, name: newUser.name }
      })

      if (req.user.adminMode || req.user.asAdmin) {
        return res.send(params)
      }
    }
  } else {
    const linkUrl = new URL(req.publicBaseUrl + '/api/invitations/_accept')
    linkUrl.searchParams.set('invit_token', token)
    const params = { link: linkUrl.href, organization: invitation.name, host: linkUrl.host, origin: linkUrl.origin }
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'invitation',
      messages: req.messages,
      to: req.body.email,
      params
    })

    sendNotification({
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invitation.department },
      topic: { key: 'simple-directory:invitation-sent' },
      title: req.__all('notifications.sentInvitation', { email: req.body.email, orgName: orga.name + (invitation.department ? ' / ' + invitation.department : '') })
    })

    if (req.user.adminMode || req.user.asAdmin) {
      return res.send(params)
    }
  }

  res.status(201).send()
}))

router.get('/_accept', asyncWrap(async (req, res, next) => {
  let invit
  let verified
  const errorUrl = new URL(`${req.publicBaseUrl}/login`)
  try {
    invit = unshortenInvit(await tokens.verify(req.app.get('keys'), req.query.invit_token))
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
    // meaning that we will not perform writes based on it
    // but we accept to check the user's existence and create the best redirect for him
    invit = tokens.decode(req.query.invit_token)
    verified = false
  }
  debug('accept invitation', invit, verified)
  const storage = req.app.get('storage')

  const user = await storage.getUserByEmail(invit.email)
  if (!user && storage.readonly) {
    errorUrl.searchParams.set('error', 'userUnknown')
    return res.redirect(errorUrl.href)
  }

  const orga = await storage.getOrganization(invit.id)
  if (!orga) {
    errorUrl.searchParams.set('error', 'orgaUnknown')
    return res.redirect(errorUrl.href)
  }

  let redirectUrl = new URL(invit.redirect || config.invitationRedirect || `${req.publicBaseUrl}/invitation`)
  redirectUrl.searchParams.set('email', invit.email)
  redirectUrl.searchParams.set('id_token_org', invit.id)

  // case where the invitation was already accepted, but we still want the user to proceed
  if (user && user.organizations && user.organizations.find(o => o.id === invit.id)) {
    debug('invitation was already accepted, redirect', redirectUrl.href)
    // missing password, invitation must have been accepted without completing account creation
    if (!await storage.hasPassword(invit.email) && !config.passwordless) {
      const payload = { id: user.id, email: user.email, action: 'changePassword' }
      const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
      const reboundRedirect = redirectUrl.href
      redirectUrl = new URL(`${req.publicBaseUrl}/login`)
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
      redirectUrl = new URL(`${req.publicBaseUrl}/login`)
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
    const reboundRedirect = redirectUrl.href
    redirectUrl = new URL(`${req.publicBaseUrl}/login`)
    redirectUrl.searchParams.set('step', 'createUser')
    redirectUrl.searchParams.set('invit_token', req.query.invit_token)
    redirectUrl.searchParams.set('redirect', reboundRedirect)
    debug('redirect to createUser step', redirectUrl.href)
    return res.redirect(redirectUrl.href)
  }

  await storage.addMember(orga, user, invit.role, invit.department)

  const notif = {
    sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invit.department },
    topic: { key: 'simple-directory:invitation-accepted' },
    title: req.__all('notifications.acceptedInvitation', { name: user.name, email: user.email, orgName: orga.name + (invit.department ? ' / ' + invit.department : '') })
  }
  // send notif to all admins subscribed to the topic
  sendNotification(notif)
  // send same notif to user himself
  sendNotification({
    ...notif,
    recipient: { id: user.id, name: user.name }
  })

  webhooks.postIdentity('user', await storage.getUser({ id: user.id }))

  if (storage.db) await limits.setNbMembers(storage.db, orga.id)

  res.redirect(redirectUrl.href)
}))
