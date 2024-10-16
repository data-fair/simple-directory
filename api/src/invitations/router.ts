import { Router } from 'express'
import config from '#config'
import { reqUser } from '@data-fair/lib-express'
import { nanoid } from 'nanoid'
const dayjs = require('dayjs')
const URL = require('url').URL
const tokens = require('../utils/tokens')
const mails = require('../mails')
import userName from '../utils/user-name.ts'
const limits = require('../utils/limits')
const { shortenInvit, unshortenInvit } = require('../utils/invitations')
const { send: sendNotification } = require('../utils/notifications')
const webhooks = require('../webhooks')
const emailValidator = require('email-validator')
const debug = require('debug')('invitations')

const router = module.exports = Router()

// Invitation for a user to join an organization from an admin of this organization
router.post('', async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib-express/events-log.js')).default
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!reqUser(req)) return res.status(401).send()
  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  debug('new invitation', req.body)
  const storage = req.app.get('storage')
  if (storage.db) {
    const limit = await limits.get(storage.db, { type: 'organization', id: req.body.id }, 'store_nb_members')
    if (limit.consumption >= limit.limit && limit.limit > 0) {
      eventsLog.info('sd.invite.limit', `limit error for /invitations route with org ${req.body.id}`, logContext)
      return res.status(429).send('L\'organisation contient déjà le nombre maximal de membres autorisé par ses quotas.')
    }
  }

  const skipMail = req.query.skip_mail === 'true'

  const invitation = req.body
  let userOrga = reqUser(req).organizations.find(o => o.id === invitation.id)
  if (config.depAdminIsOrgAdmin) {
    if (!reqUser(req).isAdmin && (!userOrga || userOrga.role !== 'admin')) {
      return res.status(403).send(req.messages.errors.permissionDenied)
    }
  } else {
    if (invitation.department) {
      userOrga = reqUser(req).organizations.find(o => o.id === invitation.id && o.department === invitation.department) || userOrga
    }
    if (!reqUser(req).isAdmin && (!userOrga || userOrga.role !== 'admin' || (userOrga.department && userOrga.department !== invitation.department))) {
      return res.status(403).send(req.messages.errors.permissionDenied)
    }
  }

  let invitSite = req.site
  let invitPublicBaseUrl = req.publicBaseUrl
  if (invitation.redirect) {
    const host = new URL(invitation.redirect).host
    invitSite = await storage.getSiteByHost(host)
    if (invitSite) {
      const url = new URL(config.publicUrl)
      url.host = host
      invitPublicBaseUrl = url.href
    }
  }

  const orga = await storage.getOrganization(invitation.id)
  if (!orga) return res.status(404).send('unknown organization')
  let dep
  if (invitation.department) {
    dep = orga.departments && orga.departments.find(d => d.id === invitation.department)
    if (!dep) return res.status(404).send('unknown department')
  }
  logContext.account = { type: 'organization', id: orga.id, name: orga.name, department: invitation.department, departmentName: dep ? dep.name : null }

  const token = tokens.sign(req.app.get('keys'), shortenInvit(invitation), config.jwtDurations.invitationToken)

  if (config.alwaysAcceptInvitation) {
    eventsLog.info('sd.invite.user-creation', `invitation sent in always accept mode immediately creates a user or adds it as member ${invitation.email}, ${orga.id} ${orga.name} ${invitation.role} ${invitation.department}`, logContext)
    // in 'always accept invitation' mode the user is not sent an email to accept the invitation
    // he is simple added to the list of members and created if needed
    const user = await storage.getUserByEmail(invitation.email, invitSite)
    if (user && user.emailConfirmed) {
      debug('in alwaysAcceptInvitation and the user already exists, immediately add it as member', invitation.email)
      await storage.addMember(orga, user, invitation.role, invitation.department)
      if (storage.db) await limits.setNbMembers(storage.db, orga.id)
      sendNotification({
        sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invitation.department },
        topic: { key: 'simple-directory:invitation-sent' },
        title: req.__all('notifications.sentInvitation', { email: req.body.email, orgName: orga.name + (dep ? ' / ' + (dep.name || dep.id) : '') })
      })
    } else {
      const newUser = {
        email: invitation.email,
        id: user ? user.id : nanoid()(),
        organizations: user ? user.organizations : [],
        emailConfirmed: false,
        defaultOrg: invitation.id,
        ignorePersonalAccount: true
      }
      if (invitSite) newUser.host = invitSite.host
      if (invitation.department) newUser.defaultDep = invitation.department
      newUser.name = userName(newUser)
      debug('in alwaysAcceptInvitation and the user does not exist, create it', newUser)
      await storage.createUser(newUser, reqUser(req))
      await storage.addMember(orga, newUser, invitation.role, invitation.department)
      if (storage.db) await limits.setNbMembers(storage.db, orga.id)
      const reboundRedirect = new URL(invitation.redirect || config.invitationRedirect || `${req.publicBaseUrl}/invitation`)
      const linkUrl = new URL(`${req.publicBaseUrl}/login`)
      linkUrl.searchParams.set('step', 'createUser')
      linkUrl.searchParams.set('invit_token', token)
      linkUrl.searchParams.set('redirect', reboundRedirect.href)
      debug('send email with link to createUser step', linkUrl.href)
      const params = {
        link: linkUrl.href,
        organization: orga.name + (dep ? ' / ' + (dep.name || dep.id) : ''),
        host: linkUrl.host,
        origin: linkUrl.origin
      }
      // send the mail either if the user does not exist or it was created more that 24 hours ago
      if (!skipMail && (!user || req.query.force_mail === 'true' || dayjs().diff(dayjs(user.created.date), 'day', true) < 1)) {
        await mails.send({
          transport: req.app.get('mailTransport'),
          key: 'invitation',
          messages: req.messages,
          to: req.body.email,
          params
        })
        eventsLog.info('sd.invite.sent', `invitation sent ${invitation.email}, ${orga.id} ${orga.name} ${invitation.tole} ${invitation.department}`, logContext)
      }

      const notif = {
        sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invitation.department },
        topic: { key: 'simple-directory:add-member' },
        title: req.__all('notifications.addMember', { name: newUser.name, email: newUser.email, orgName: orga.name + (dep ? ' / ' + (dep.name || dep.id) : '') })
      }
      // send notif to all admins subscribed to the topic
      sendNotification(notif)
      // send same notif to user himself
      sendNotification({
        ...notif,
        recipient: { id: newUser.id, name: newUser.name }
      })

      if (reqUser(req).adminMode || reqUser(req).asAdmin) {
        return res.send(params)
      }
    }
  } else {
    const linkUrl = new URL(invitPublicBaseUrl + '/api/invitations/_accept')
    linkUrl.searchParams.set('invit_token', token)
    const params = {
      link: linkUrl.href,
      organization: orga.name + (dep ? ' / ' + (dep.name || dep.id) : ''),
      host: linkUrl.host,
      origin: linkUrl.origin
    }
    if (!skipMail) {
      await mails.send({
        transport: req.app.get('mailTransport'),
        key: 'invitation',
        messages: req.messages,
        to: req.body.email,
        params
      })
      eventsLog.info('sd.invite.sent', `invitation sent ${invitation.email}, ${orga.id} ${orga.name} ${invitation.tole} ${invitation.department}`, logContext)
    }

    sendNotification({
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invitation.department },
      topic: { key: 'simple-directory:invitation-sent' },
      title: req.__all('notifications.sentInvitation', { email: req.body.email, orgName: orga.name + (dep ? ' / ' + (dep.name || dep.id) : '') })
    })

    if (reqUser(req).adminMode || reqUser(req).asAdmin) {
      return res.send(params)
    }
  }

  res.status(201).send()
})

router.get('/_accept', async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib-express/events-log.js')).default
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

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

  const user = await storage.getUserByEmail(invit.email, req.site)
  logContext.user = user
  if (!user && storage.readonly) {
    errorUrl.searchParams.set('error', 'userUnknown')
    return res.redirect(errorUrl.href)
  }

  const orga = await storage.getOrganization(invit.id)
  if (!orga) {
    errorUrl.searchParams.set('error', 'orgaUnknown')
    return res.redirect(errorUrl.href)
  }
  logContext.account = { type: 'organization', id: orga.id, name: orga.name, department: invit.department }

  let redirectUrl = new URL(invit.redirect || config.invitationRedirect || `${req.publicBaseUrl}/invitation`)
  redirectUrl.searchParams.set('email', invit.email)
  redirectUrl.searchParams.set('id_token_org', invit.id)
  if (invit.department) redirectUrl.searchParams.set('id_token_dep', invit.department)

  // case where the invitation was already accepted, but we still want the user to proceed
  if (user && user.organizations && user.organizations.find(o => o.id === invit.id && (o.department || null) === (invit.department || null))) {
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
      if (invit.department) redirectUrl.searchParams.set('id_token_dep', invit.department)
      redirectUrl.searchParams.set('action_token', token)
      redirectUrl.searchParams.set('redirect', reboundRedirect)
      debug('redirect to changePassword step', redirectUrl.href)
      return res.redirect(redirectUrl.href)
    }
    if (!reqUser(req) || reqUser(req).email !== invit.email) {
      const reboundRedirect = redirectUrl.href
      redirectUrl = new URL(`${req.publicBaseUrl}/login`)
      redirectUrl.searchParams.set('email', invit.email)
      redirectUrl.searchParams.set('id_token_org', invit.id)
      if (invit.department) redirectUrl.searchParams.set('id_token_dep', invit.department)
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

  eventsLog.info('sd.invite.accepted', `invitation accepted ${invit.email}, ${orga.id} ${orga.name} ${invit.department} ${invit.role}`, logContext)

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
})
