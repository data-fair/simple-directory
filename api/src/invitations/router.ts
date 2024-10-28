import { type UserWritable, type Invitation } from '#types'
import { Router } from 'express'
import config from '#config'
import { assertAccountRole, reqUser, reqSession, reqSiteUrl, session, httpError, reqUserAuthenticated } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import { pushEvent, pushNotification } from '@data-fair/lib-node/events-queue.js'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import { reqI18n, __all, __ } from '#i18n'
import storages from '#storages'
import { getLimits, setNbMembersLimit, reqSite, getSiteByHost, shortenInvit, unshortenInvit, sendMail, decodeToken, signToken, postUserIdentityWebhook } from '#services'
import emailValidator from 'email-validator'
import Debug from 'debug'

const debug = Debug('invitations')

const router = Router()
export default router

// Invitation for a user to join an organization from an admin of this organization
router.post('', async (req, res, next) => {
  const user = reqUserAuthenticated(req)

  const { query, body } = (await import('#doc/invitations/post-req/index.ts')).returnValid(req, { name: 'req' })

  const logContext: EventLogContext = { req }

  if (!emailValidator.validate(body.email)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  debug('new invitation', body)
  const storage = storages.globalStorage
  const invitation = body
  assertAccountRole(reqSession(req), { type: 'organization', id: invitation.id, department: invitation.department }, 'admin', { acceptDepAsRoot: config.depAdminIsOrgAdmin })

  let invitSite = await reqSite(req)
  let invitPublicBaseUrl = reqSiteUrl(req) + '/simple-directory'
  if (invitation.redirect) {
    const host = new URL(invitation.redirect).host
    invitSite = (await getSiteByHost(host)) ?? undefined
    if (invitSite) {
      const url = new URL(config.publicUrl)
      url.host = host
      invitPublicBaseUrl = url.href
    }
  }

  const orga = await storage.getOrganization(invitation.id)
  if (!orga) return res.status(404).send('unknown organization')

  const limits = await getLimits(orga)
  if (limits.store_nb_members.limit > 0 && limits.store_nb_members.consumption >= limits.store_nb_members.limit) {
    eventsLog.info('sd.invite.limit', `limit error for /invitations route with org ${body.id}`, logContext)
    return res.status(429).send('L\'organisation contient déjà le nombre maximal de membres autorisé par ses quotas.')
  }

  let dep
  if (invitation.department) {
    dep = orga.departments && orga.departments.find(d => d.id === invitation.department)
    if (!dep) return res.status(404).send('unknown department')
  }
  logContext.account = { type: 'organization', id: orga.id, name: orga.name, department: invitation.department, departmentName: dep?.name }

  const token = await signToken(shortenInvit(invitation), config.jwtDurations.invitationToken)

  if (config.alwaysAcceptInvitation) {
    eventsLog.info('sd.invite.user-creation', `invitation sent in always accept mode immediately creates a user or adds it as member ${invitation.email}, ${orga.id} ${orga.name} ${invitation.role} ${invitation.department}`, logContext)
    // in 'always accept invitation' mode the user is not sent an email to accept the invitation
    // he is simple added to the list of members and created if needed
    const existingUser = await storage.getUserByEmail(invitation.email, invitSite)
    if (existingUser && existingUser.emailConfirmed) {
      debug('in alwaysAcceptInvitation and the user already exists, immediately add it as member', invitation.email)
      await storage.addMember(orga, existingUser, invitation.role, invitation.department)
      await setNbMembersLimit(orga.id)
      pushEvent({
        sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invitation.department },
        topic: { key: 'simple-directory:invitation-sent' },
        title: __all('notifications.sentInvitation', { email: body.email, orgName: orga.name + (dep ? ' / ' + (dep.name || dep.id) : '') })
      })
    } else {
      const newUserDraft: UserWritable = {
        email: invitation.email,
        id: existingUser ? existingUser.id : nanoid(),
        organizations: existingUser ? existingUser.organizations : [],
        emailConfirmed: false,
        defaultOrg: invitation.id,
        ignorePersonalAccount: true
      }
      if (invitSite) newUserDraft.host = invitSite.host
      if (invitation.department) newUserDraft.defaultDep = invitation.department
      debug('in alwaysAcceptInvitation and the user does not exist, create it', newUserDraft)
      const reboundRedirect = new URL(invitation.redirect || config.invitationRedirect || `${reqSiteUrl(req) + '/simple-directory'}/invitation`)
      const newUser = await storage.createUser(newUserDraft, user)
      await storage.addMember(orga, newUser, invitation.role, invitation.department)
      await setNbMembersLimit(orga.id)
      const linkUrl = new URL(`${reqSiteUrl(req) + '/simple-directory'}/login`)
      linkUrl.searchParams.set('step', 'createUser')
      linkUrl.searchParams.set('invit_token', token)
      linkUrl.searchParams.set('redirect', reboundRedirect.href)
      debug('send email with link to createUser step', linkUrl.href)
      const params = {
        link: linkUrl.href,
        organization: orga.name + (dep ? ' / ' + (dep.name || dep.id) : '')
      }
      // send the mail either if the user does not exist or it was created more that 24 hours ago
      if (!query.skip_mail && (!existingUser || query.force_mail || (existingUser.created && dayjs().diff(dayjs(existingUser.created.date), 'day', true) > 1))) {
        await sendMail('invitation', reqI18n(req).messages, body.email, params)
        eventsLog.info('sd.invite.sent', `invitation sent ${invitation.email}, ${orga.id} ${orga.name} ${invitation.role} ${invitation.department}`, logContext)
      }

      const event = {
        sender: { type: 'organization' as const, id: orga.id, name: orga.name, role: 'admin', department: invitation.department },
        topic: { key: 'simple-directory:add-member' },
        title: __all('notifications.addMember', { name: newUser.name, email: newUser.email, orgName: orga.name + (dep ? ' / ' + (dep.name || dep.id) : '') })
      }
      // send notif to all admins subscribed to the topic
      pushEvent(event)
      // send same notif to user himself
      pushNotification({
        sender: event.sender,
        topic: event.topic,
        title: __(req, 'notifications.addMember', { name: newUser.name, email: newUser.email, orgName: orga.name + (dep ? ' / ' + (dep.name || dep.id) : '') }),
        recipient: { id: newUser.id, name: newUser.name }
      })

      if (user.adminMode || user.asAdmin) {
        return res.send(params)
      }
    }
  } else {
    const linkUrl = new URL(invitPublicBaseUrl + '/api/invitations/_accept')
    linkUrl.searchParams.set('invit_token', token)
    const params = {
      link: linkUrl.href,
      organization: orga.name + (dep ? ' / ' + (dep.name || dep.id) : '')
    }
    if (!query.skip_mail) {
      await sendMail('invitation', reqI18n(req).messages, body.email, params)
      eventsLog.info('sd.invite.sent', `invitation sent ${invitation.email}, ${orga.id} ${orga.name} ${invitation.role} ${invitation.department}`, logContext)
    }

    pushEvent({
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invitation.department },
      topic: { key: 'simple-directory:invitation-sent' },
      title: __all('notifications.sentInvitation', { email: body.email, orgName: orga.name + (dep ? ' / ' + (dep.name || dep.id) : '') })
    })

    if (user.adminMode || user.asAdmin) {
      return res.send(params)
    }
  }

  res.status(201).send()
})

router.get('/_accept', async (req, res, next) => {
  const loggedUser = reqUser(req)
  const logContext: EventLogContext = { req }
  if (typeof req.query.invit_token !== 'string') throw httpError(400)

  let invit: Invitation
  let verified
  const errorUrl = new URL(`${reqSiteUrl(req) + '/simple-directory'}/login`)
  try {
    invit = unshortenInvit(await session.verifyToken(req.query.invit_token))
    verified = true
  } catch (err: any) {
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
    invit = unshortenInvit(decodeToken(req.query.invit_token))
    verified = false
  }
  debug('accept invitation', invit, verified)
  const storage = storages.globalStorage

  const existingUser = await storage.getUserByEmail(invit.email, await reqSite(req))
  logContext.user = existingUser
  if (!existingUser && storage.readonly) {
    errorUrl.searchParams.set('error', 'userUnknown')
    return res.redirect(errorUrl.href)
  }

  const orga = await storage.getOrganization(invit.id)
  if (!orga) {
    errorUrl.searchParams.set('error', 'orgaUnknown')
    return res.redirect(errorUrl.href)
  }
  logContext.account = { type: 'organization', id: orga.id, name: orga.name, department: invit.department }

  let redirectUrl = new URL(invit.redirect || config.invitationRedirect || `${reqSiteUrl(req) + '/simple-directory'}/invitation`)
  redirectUrl.searchParams.set('email', invit.email)
  redirectUrl.searchParams.set('id_token_org', invit.id)
  if (invit.department) redirectUrl.searchParams.set('id_token_dep', invit.department)

  // case where the invitation was already accepted, but we still want the user to proceed
  if (existingUser && existingUser.organizations && existingUser.organizations.find(o => o.id === invit.id && (o.department || null) === (invit.department || null))) {
    debug('invitation was already accepted, redirect', redirectUrl.href)
    // missing password, invitation must have been accepted without completing account creation
    if (!storage.getPassword) {
      throw new Error('missing password verification implementation')
    } else {
      if (!await storage.getPassword(invit.email) && !config.passwordless) {
        const payload = { id: existingUser.id, email: existingUser.email, action: 'changePassword' }
        const token = await signToken(payload, config.jwtDurations.initialToken)
        const reboundRedirect = redirectUrl.href
        redirectUrl = new URL(`${reqSiteUrl(req) + '/simple-directory'}/login`)
        redirectUrl.searchParams.set('step', 'changePassword')
        redirectUrl.searchParams.set('email', invit.email)
        redirectUrl.searchParams.set('id_token_org', invit.id)
        if (invit.department) redirectUrl.searchParams.set('id_token_dep', invit.department)
        redirectUrl.searchParams.set('action_token', token)
        redirectUrl.searchParams.set('redirect', reboundRedirect)
        debug('redirect to changePassword step', redirectUrl.href)
        return res.redirect(redirectUrl.href)
      }
    }
    if (!loggedUser || loggedUser.email !== invit.email) {
      const reboundRedirect = redirectUrl.href
      redirectUrl = new URL(`${reqSiteUrl(req) + '/simple-directory'}/login`)
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

  const limits = await getLimits(orga)
  if (limits.store_nb_members.limit > 0 && limits.store_nb_members.consumption >= limits.store_nb_members.limit) {
    errorUrl.searchParams.set('error', 'maxNbMembers')
    return res.redirect(errorUrl.href)
  }

  if (!existingUser) {
    const reboundRedirect = redirectUrl.href
    redirectUrl = new URL(`${reqSiteUrl(req) + '/simple-directory'}/login`)
    redirectUrl.searchParams.set('step', 'createUser')
    redirectUrl.searchParams.set('invit_token', req.query.invit_token)
    redirectUrl.searchParams.set('redirect', reboundRedirect)
    debug('redirect to createUser step', redirectUrl.href)
    return res.redirect(redirectUrl.href)
  }

  await storage.addMember(orga, existingUser, invit.role, invit.department)

  eventsLog.info('sd.invite.accepted', `invitation accepted ${invit.email}, ${orga.id} ${orga.name} ${invit.department} ${invit.role}`, logContext)

  const event = {
    sender: { type: 'organization' as const, id: orga.id, name: orga.name, role: 'admin', department: invit.department },
    topic: { key: 'simple-directory:invitation-accepted' },
    title: __all('notifications.acceptedInvitation', { name: existingUser.name, email: existingUser.email, orgName: orga.name + (invit.department ? ' / ' + invit.department : '') })
  }
  // send notif to all admins subscribed to the topic
  pushEvent(event)
  // send same notif to user himself
  pushNotification({
    sender: event.sender,
    topic: event.topic,
    title: __(req, 'notifications.acceptedInvitation', { name: existingUser.name, email: existingUser.email, orgName: orga.name + (invit.department ? ' / ' + invit.department : '') }),
    recipient: { id: existingUser.id, name: existingUser.name }
  })

  postUserIdentityWebhook(await storage.getUser(existingUser.id))

  await setNbMembersLimit(orga.id)

  res.redirect(redirectUrl.href)
})
