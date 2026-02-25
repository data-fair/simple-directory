import { type UserWritable, type Invitation, type ActionPayload, type ShortenedInvitation } from '#types'
import { Router } from 'express'
import config from '#config'
import { assertAccountRole, reqUser, reqSession, reqSiteUrl, session, httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import eventsQueue from '#events-queue'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import { reqI18n, __all, __ } from '#i18n'
import storages from '#storages'
import { getOrgLimits, setNbMembersLimit, reqSite, shortenInvit, unshortenInvit, sendMailI18n, decodeToken, signToken, postUserIdentityWebhook, getInvitationRedirect, getSiteBaseUrl, getInvitSite, keepalive, switchOrganization } from '#services'
import emailValidator from 'email-validator'
import Debug from 'debug'

const debug = Debug('invitations')

const router = Router()
export default router

// Invitation for a user to join an organization from an admin of this organization
router.post('', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  const user = session.user

  const { query, body } = (await import('#doc/invitations/post-req/index.ts')).returnValid(req, { name: 'req' })

  const logContext: EventLogContext = { req }

  if (body.email) body.email = body.email.trim()
  if (!emailValidator.validate(body.email)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  debug('new invitation', body)
  const storage = storages.globalStorage
  const invitation = body

  debug('create invitation route', reqSiteUrl(req) + req.originalUrl)

  const invitSite = await getInvitSite(req, invitation.redirect)
  const invitPublicBaseUrl = invitSite ? (getSiteBaseUrl(invitSite) + '/simple-directory') : config.publicUrl

  const orga = await storage.getOrganization(invitation.id)
  if (!orga) return res.status(404).send('unknown organization')

  const departments = invitation.departments ?? (invitation.department ? [invitation.department] : [])
  const departmentNames: string[] = []

  if (session.siteRole === 'admin' && invitSite && invitSite.host === orga.host) {
    // ok for site admins
  } else {
    if (departments.length > 0) {
      invitation.departments = departments
      for (const department of departments) {
        const dept = orga.departments && orga.departments.find(d => d.id === department)
        if (!dept) return res.status(404).send('unknown department: ' + department)
        departmentNames.push(dept.name || dept.id)
        assertAccountRole(reqSession(req), { type: 'organization', id: invitation.id, department }, 'admin', { acceptDepAsRoot: config.depAdminIsOrgAdmin })
      }
    } else {
      delete invitation.departments
      assertAccountRole(reqSession(req), { type: 'organization', id: invitation.id }, 'admin')
    }
  }

  const limits = await getOrgLimits(orga)
  if (limits.store_nb_members.limit > 0 && limits.store_nb_members.consumption >= limits.store_nb_members.limit) {
    eventsLog.info('sd.invite.limit', `limit error for /invitations route with org ${body.id}`, logContext)
    return res.status(429).send('L\'organisation contient déjà le nombre maximal de membres autorisé par ses quotas.')
  }

  logContext.account = { type: 'organization', id: orga.id, name: orga.name }

  const invitTargetLabel = orga.name + (departmentNames.length ? ` (${departmentNames.join(', ')})` : '')

  const token = await signToken(shortenInvit(invitation), config.jwtDurations.invitationToken)
  const reboundRedirect = new URL(getInvitationRedirect(reqSiteUrl(req), invitation.redirect))

  if (config.alwaysAcceptInvitation) {
    debug('in alwaysAcceptInvitation mode')
    eventsLog.info('sd.invite.user-creation', `invitation sent in always accept mode immediately creates a user or adds it as member ${invitation.email}, ${orga.id} ${orga.name} ${invitation.role} ${invitation.departments?.join('|')}`, logContext)
    // in 'always accept invitation' mode the user is not sent an email to accept the invitation
    // he is simple added to the list of members and created if needed
    const existingUser = await storage.getUserByEmail(invitation.email, invitSite)
    if (existingUser && existingUser.emailConfirmed) {
      debug('in alwaysAcceptInvitation and the user already exists, immediately add it as member', invitation.email)
      if (departments.length > 0) {
        for (const deptId of departments) {
          await storage.addMember(orga, existingUser, invitation.role, deptId)
          eventsQueue?.pushEvent({
            sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: deptId },
            topic: { key: 'simple-directory:invitation-sent' },
            title: __all('notifications.sentInvitation', { email: body.email, orgName: invitTargetLabel })
          })
        }
      } else {
        await storage.addMember(orga, existingUser, invitation.role, undefined)
        eventsQueue?.pushEvent({
          sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin' },
          topic: { key: 'simple-directory:invitation-sent' },
          title: __all('notifications.sentInvitation', { email: body.email, orgName: invitTargetLabel })
        })
      }
      await setNbMembersLimit(orga.id)
    } else {
      const newUserDraft: UserWritable = {
        email: invitation.email,
        id: existingUser ? existingUser.id : nanoid(),
        organizations: existingUser ? existingUser.organizations : [],
        emailConfirmed: false,
        defaultOrg: invitation.id,
        ignorePersonalAccount: true
      }
      if (invitSite) {
        newUserDraft.host = invitSite.host
        if (invitSite.path) newUserDraft.path = invitSite.path
      }
      if (invitation.departments?.length) newUserDraft.defaultDep = invitation.departments[0]
      debug('in alwaysAcceptInvitation and the user does not exist, create it', newUserDraft)
      const newUser = await storage.createUser(newUserDraft, user)
      if (departments.length > 0) {
        for (const deptId of departments) {
          await storage.addMember(orga, newUser, invitation.role, deptId)
          eventsQueue?.pushEvent({
            sender: { type: 'organization' as const, id: orga.id, name: orga.name, role: 'admin', department: deptId },
            topic: { key: 'simple-directory:add-member' },
            title: __all('notifications.addMember', { name: newUser.name, email: newUser.email, orgName: invitTargetLabel })
          })
        }
      } else {
        await storage.addMember(orga, newUser, invitation.role, undefined)
        eventsQueue?.pushEvent({
          sender: { type: 'organization' as const, id: orga.id, name: orga.name, role: 'admin' },
          topic: { key: 'simple-directory:add-member' },
          title: __all('notifications.addMember', { name: newUser.name, email: newUser.email, orgName: invitTargetLabel })
        })
      }
      await setNbMembersLimit(orga.id)
      const linkUrl = new URL(`${invitPublicBaseUrl}/login`)
      linkUrl.searchParams.set('step', 'createUser')
      linkUrl.searchParams.set('invit_token', token)
      linkUrl.searchParams.set('redirect', reboundRedirect.href)
      debug('send email with link to createUser step', linkUrl.href)
      const params = {
        link: linkUrl.href,
        organization: invitTargetLabel,
        secondaryHost: new URL(reboundRedirect.href).host
      }
      const mailKey = params.secondaryHost !== new URL(linkUrl.href).host ? 'invitationSecondary' : 'invitation'
      // send the mail either if the user does not exist or it was created more that 24 hours ago
      if (!query.skip_mail && (!existingUser || query.force_mail || (existingUser.created && dayjs().diff(dayjs(existingUser.created.date), 'day', true) > 1))) {
        await sendMailI18n(mailKey, reqI18n(req).messages, body.email, params)
        eventsLog.info('sd.invite.sent', `invitation sent ${invitation.email}, ${orga.id} ${orga.name} ${invitation.role} ${departments.join(',')}`, logContext)
      }

      // send same notif to user himself
      eventsQueue?.pushNotification({
        sender: { type: 'organization' as const, id: orga.id, name: orga.name },
        topic: { key: 'simple-directory:add-member' },
        title: __(req, 'notifications.addMember', { name: newUser.name, email: newUser.email, orgName: invitTargetLabel }),
        recipient: { id: newUser.id, name: newUser.name }
      })

      if (user.adminMode || user.asAdmin) {
        return res.send(params)
      }
    }
  } else {
    debug('not in alwaysAcceptInvitation mode')
    const linkUrl = new URL(invitPublicBaseUrl + '/api/invitations/_accept')
    debug('prepare accept link', linkUrl.href)
    linkUrl.searchParams.set('invit_token', token)
    const params = {
      link: linkUrl.href,
      organization: invitTargetLabel,
      secondaryHost: reboundRedirect.host
    }
    const mailKey = params.secondaryHost !== new URL(linkUrl.href).host ? 'invitationSecondary' : 'invitation'
    if (!query.skip_mail) {
      debug('send invitation email', body.email, params)
      await sendMailI18n(mailKey, reqI18n(req).messages, body.email, params)
      eventsLog.info('sd.invite.sent', `invitation sent ${invitation.email}, ${orga.id} ${orga.name} ${invitation.role} ${departments.join(',')}`, logContext)
    }

    eventsQueue?.pushEvent({
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: departments[0] },
      topic: { key: 'simple-directory:invitation-sent' },
      title: __all('notifications.sentInvitation', { email: body.email, orgName: invitTargetLabel })
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

  debug('accept invitation route', reqSiteUrl(req) + req.originalUrl)

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
    invit = unshortenInvit(decodeToken(req.query.invit_token) as ShortenedInvitation)
    verified = false
  }
  debug('accept invitation', invit, verified)
  const storage = storages.globalStorage

  const existingUser = await storage.getUserByEmail(invit.email, await reqSite(req))
  debug('found existing user on site ?', existingUser)
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
  logContext.account = { type: 'organization', id: orga.id, name: orga.name, department: invit.departments?.[0] }

  let redirectUrl = new URL(getInvitationRedirect(reqSiteUrl(req), invit.redirect))

  // Get departments array from invitation
  const invitDepartments = invit.departments ?? []

  // case where the invitation was already accepted for all departments, but we still want the user to proceed
  const existingMemberDepts = existingUser?.organizations?.filter(o => o.id === invit.id).map(o => o.department) || []
  const alreadyAcceptedAll = invitDepartments.length > 0 && invitDepartments.every(deptId => existingMemberDepts.includes(deptId))
  const someAlreadyMember = invitDepartments.length > 0 && invitDepartments.some(deptId => existingMemberDepts.includes(deptId))

  if (alreadyAcceptedAll && existingUser) {
    debug('invitation was already accepted for all departments, redirect', redirectUrl.href)
    // missing password, invitation must have been accepted without completing account creation
    if (!config.passwordless && config.alwaysAcceptInvitation && storage.getPassword &&
      !await storage.getPassword(existingUser.id) && !Object.keys(existingUser.oauth ?? {}).length &&
      !Object.keys(existingUser.oidc ?? {}).length && !Object.keys(existingUser.saml2 ?? {}).length
    ) {
      const payload: ActionPayload = { id: existingUser.id, email: existingUser.email, action: 'changePassword' }
      const token = await signToken(payload, config.jwtDurations.initialToken)
      const reboundRedirect = redirectUrl.href
      redirectUrl = new URL(`${reqSiteUrl(req) + '/simple-directory'}/login`)
      redirectUrl.searchParams.set('step', 'changePassword')
      redirectUrl.searchParams.set('email', invit.email)
      redirectUrl.searchParams.set('id_token_org', invit.id)
      if (invitDepartments[0]) redirectUrl.searchParams.set('id_token_dep', invitDepartments[0])
      redirectUrl.searchParams.set('action_token', token)
      redirectUrl.searchParams.set('redirect', reboundRedirect)
      debug('redirect existing user/member to changePassword step', redirectUrl.href)
      return res.redirect(redirectUrl.href)
    }

    if (!loggedUser || loggedUser.email !== invit.email) {
      const reboundRedirect = redirectUrl.href
      redirectUrl = new URL(`${reqSiteUrl(req)}/simple-directory/login`)
      redirectUrl.searchParams.set('email', invit.email)
      redirectUrl.searchParams.set('id_token_org', invit.id)
      if (invitDepartments[0]) redirectUrl.searchParams.set('id_token_dep', invitDepartments[0])
      redirectUrl.searchParams.set('redirect', reboundRedirect)
      debug('redirect existing user/member to login', redirectUrl.href)
      return res.redirect(redirectUrl.href)
    }
    return res.redirect(redirectUrl.href)
  }

  if (!verified) {
    debug('reject invitation where token was expired')
    errorUrl.searchParams.set('error', 'expiredInvitationToken')
    return res.redirect(errorUrl.href)
  }

  // If some departments are already accepted, filter them out
  const newDepartments = someAlreadyMember
    ? invitDepartments.filter(deptId => !existingMemberDepts.includes(deptId))
    : invitDepartments
  const newDepartmentsNames: string[] = []
  for (const deptId of newDepartments) {
    const dept = orga.departments && orga.departments.find(d => d.id === deptId)
    if (!dept) return res.status(404).send('unknown department: ' + deptId)
    newDepartmentsNames.push(dept.name || dept.id)
  }
  const invitTargetLabel = orga.name + (newDepartmentsNames.length ? ` (${newDepartmentsNames.join(', ')})` : '')

  const limits = await getOrgLimits(orga)
  if (limits.store_nb_members.limit > 0 && limits.store_nb_members.consumption >= limits.store_nb_members.limit) {
    errorUrl.searchParams.set('error', 'maxNbMembers')
    debug('reject invitation because of nb members limits')
    return res.redirect(errorUrl.href)
  }

  if (!existingUser) {
    const reboundRedirect = redirectUrl.href
    redirectUrl = new URL(`${reqSiteUrl(req)}/simple-directory/login`)
    redirectUrl.searchParams.set('step', 'createUser')
    redirectUrl.searchParams.set('invit_token', req.query.invit_token)
    redirectUrl.searchParams.set('redirect', reboundRedirect)
    debug('redirect non-existing to createUser step', redirectUrl.href)
    return res.redirect(redirectUrl.href)
  }

  const isFirstOrg = !existingUser.organizations.length
  if (newDepartments.length > 0) {
    for (const deptId of newDepartments) {
      await storage.addMember(orga, existingUser, invit.role, deptId)
    }
  } else if (invitDepartments.length === 0) {
    await storage.addMember(orga, existingUser, invit.role, undefined)
  }

  // if this is the first invitation of the user in an org
  // set this org as their default account, matches most use cases
  // user created individually but invited afterwards
  if (isFirstOrg) {
    const userPatch: any = {
      ignorePersonalAccount: true,
      defaultOrg: orga.id,
    }
    if (invitDepartments[0]) userPatch.defaultDep = invitDepartments[0]
    await storage.patchUser(existingUser.id, userPatch)
  }

  eventsLog.info('sd.invite.accepted', `invitation accepted ${invit.email}, ${orga.id} ${orga.name} ${invitDepartments.join(',')} ${invit.role}`, logContext)

  const event = {
    sender: { type: 'organization' as const, id: orga.id, name: orga.name, role: 'admin', department: invitDepartments[0] },
    topic: { key: 'simple-directory:invitation-accepted' },
    title: __all('notifications.acceptedInvitation', { name: existingUser.name, email: existingUser.email, orgName: invitTargetLabel })
  }
  // send notif to all admins subscribed to the topic
  eventsQueue?.pushEvent(event)
  // send same notif to user himself
  eventsQueue?.pushNotification({
    sender: event.sender,
    topic: event.topic,
    title: __(req, 'notifications.acceptedInvitation', { name: existingUser.name, email: existingUser.email, orgName: invitTargetLabel }),
    recipient: { id: existingUser.id, name: existingUser.name }
  })

  postUserIdentityWebhook(await storage.getUser(existingUser.id))

  await setNbMembersLimit(orga.id)

  if (loggedUser && loggedUser.email === invit.email) {
    await keepalive(req, res)
    switchOrganization(req, res, loggedUser, invit.id, invitDepartments[0], invit.role)
    redirectUrl.searchParams.set('email', invit.email)
    redirectUrl.searchParams.set('id_token_org', invit.id)
    if (invitDepartments[0]) redirectUrl.searchParams.set('id_token_dep', invitDepartments[0])
    res.redirect(redirectUrl.href)
  } else {
    const reboundRedirect = redirectUrl.href
    redirectUrl = new URL(`${reqSiteUrl(req)}/simple-directory/login`)
    redirectUrl.searchParams.set('email', invit.email)
    redirectUrl.searchParams.set('id_token_org', invit.id)
    if (invitDepartments[0]) redirectUrl.searchParams.set('id_token_dep', invitDepartments[0])
    redirectUrl.searchParams.set('redirect', reboundRedirect)
    debug('redirect to login', redirectUrl.href)
    res.redirect(redirectUrl.href)
  }
})
