import { type Organization, type UserWritable } from '#types'
import { Router, type RequestHandler } from 'express'
import config, { superadmin } from '#config'
import { reqSessionAuthenticated, mongoPagination, mongoSort, session, reqSiteUrl, reqSession } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import { nanoid } from 'nanoid'
import { pushEvent } from '@data-fair/lib-node/events-queue.js'
import { reqI18n, __all, __date } from '#i18n'
import storages from '#storages'
import mongo from '#mongo'
import emailValidator from 'email-validator'
import type { FindUsersParams } from '../storages/interface.ts'
import { validatePassword, hashPassword, unshortenInvit, reqSite, deleteIdentityWebhook, sendMail, getLimits, setNbMembersLimit, getTokenPayload, getDefaultUserOrg, prepareCallbackUrl, postUserIdentityWebhook, keepalive, signToken } from '#services'

const router = Router()

const rejectCoreIdUser: RequestHandler = (req, res, next) => {
  const session = reqSession(req)
  if (session.user?.idp) return res.status(403).send('This route is not available for users with a core identity provider')
  next()
}

// Get the list of users
router.get('', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const session = reqSession(req)

  const listMode = config.listUsersMode || config.listEntitiesMode
  if (listMode === 'authenticated' && !session.user) return res.send({ results: [], count: 0 })
  if (listMode === 'admin' && !session.user?.adminMode) return res.send({ results: [], count: 0 })

  const params: FindUsersParams = { ...mongoPagination(req.query), sort: mongoSort(req.query.sort) }

  // Only service admins can request to see all field. Other users only see id/name
  const allFields = req.query.allFields === 'true'
  if (allFields) {
    if (!session.user?.adminMode) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  } else {
    params.select = ['id', 'name']
  }

  if (req.query) {
    if (typeof req.query.ids === 'string') params.ids = req.query.ids.split(',')
    if (typeof req.query.q === 'string') params.q = req.query.q
  }
  const users = await storages.globalStorage.findUsers(params)

  eventsLog.info('sd.list-users', 'list users', logContext)

  res.json(users)
})

// TODO: block when onlyCreateInvited is true ?
router.post('', async (req, res, next) => {
  const logContext: EventLogContext = { req }

  if (!req.body || !req.body.email) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)

  const { body, query } = (await import('#doc/users/post-req/index.ts')).returnValid(req, { name: 'req' })

  const storage = storages.globalStorage

  // used to create a user and accept a member invitation at the same time
  // if the invitation is not valid, better not to proceed with the user creation
  let invit
  let orga: Organization | undefined
  if (typeof req.query.invit_token === 'string') {
    try {
      invit = unshortenInvit(await session.verifyToken(req.query.invit_token))
    } catch (err: any) {
      return res.status(400).send(err.name === 'TokenExpiredError' ? reqI18n(req).messages.errors.expiredInvitationToken : reqI18n(req).messages.errors.invalidInvitationToken)
    }
    orga = await storage.getOrganization(invit.id)
    if (!orga) return res.status(400).send(reqI18n(req).messages.errors.orgaUnknown)
    logContext.account = { type: 'organization', id: orga.id, name: orga.name, department: invit.department, departmentName: invit.departmentName }
    if (invit.email !== body.email) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  } else if (config.onlyCreateInvited) {
    return res.status(400).send('users can only be created from an invitation')
  }

  // create user
  const newUser: UserWritable = {
    email: body.email,
    id: nanoid(),
    firstName: body.firstName,
    lastName: body.lastName,
    emailConfirmed: false,
    organizations: []
  }
  const site = await reqSite(req)
  if (site) newUser.host = site.host

  if (invit) {
    newUser.emailConfirmed = true
    newUser.defaultOrg = invit.id
    if (invit.department) newUser.defaultDep = invit.department
    newUser.ignorePersonalAccount = true
  }

  // password is optional as we support passwordless auth
  if (body.password) {
    if (!validatePassword(req.body.password)) {
      return res.status(400).send(reqI18n(req).messages.errors.malformedPassword)
    }
    newUser.password = await hashPassword(body.password)
  }

  const user = await storages.globalStorage.getUserByEmail(body.email, await reqSite(req))

  // email is already taken, send a conflict email
  const link = (req.query.redirect as string) || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory'
  if (user && user.emailConfirmed !== false) {
    const linkUrl = new URL(link)
    await sendMail('conflict', reqI18n(req).messages, body.email, { host: linkUrl.host, origin: linkUrl.origin })
    return res.status(204).send()
  }

  // the user was invited in alwaysAcceptInvitations mode, but the membership was revoked
  if (invit && config.alwaysAcceptInvitation && (!user || !user.organizations.find(o => o.id === orga?.id))) {
    return res.status(400).send(reqI18n(req).messages.errors.invalidInvitationToken)
  }

  // Re-create a user that was never validated.. first clean temporary user
  if (user && user.emailConfirmed === false) {
    logContext.user = user
    if (user.organizations && invit) {
      // This user was created empty from an invitation in 'alwaysAcceptInvitations' mode
      newUser.id = user.id
      newUser.organizations = user.organizations
    } else {
      eventsLog.info('sd.user.del-temp-user', 'temp user was deleted/recreated', logContext)
      await storage.deleteUser(user.id)
    }
  }

  const createdUser = await storage.createUser(newUser, undefined, new URL(link).host)
  eventsLog.info('sd.user.create', 'user was created', logContext)

  if (invit && !config.alwaysAcceptInvitation && orga) {
    const limits = await getLimits(orga)
    if (limits.store_nb_members.limit >= 0 && limits.store_nb_members.consumption >= limits.store_nb_members.limit) {
      return res.status(400).send(reqI18n(req).messages.errors.maxNbMembers)
    }
    eventsLog.info('sd.user.accept-invite', 'user accepted an invitation', logContext)
    await storage.addMember(orga, createdUser, invit.role, invit.department)
    pushEvent({
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: __all('notifications.acceptedInvitation', { name: createdUser.name, email: createdUser.email, orgName: orga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    await setNbMembersLimit(orga.id)
  }

  if (invit) {
    // no need to confirm email if the user already comes from an invitation link
    // we already created the user with emailConfirmed=true
    const payload = getTokenPayload(createdUser)
    const linkUrl = await prepareCallbackUrl(req, payload, req.query.redirect as string | undefined, getDefaultUserOrg(createdUser, invit && invit.id, invit && invit.department))
    return res.send(linkUrl)
  } else {
    // prepare same link and payload as for a passwordless authentication
    // the user will be validated and authenticated at the same time by the token_callback route
    const payload = { ...getTokenPayload(createdUser), emailConfirmed: true }
    const linkUrl = await prepareCallbackUrl(req, payload, query.redirect, getDefaultUserOrg(createdUser, query.org, query.dep))
    await sendMail('creation', reqI18n(req).messages, body.email, { link: linkUrl.href })
    // this route doesn't return any info to its caller to prevent giving any indication of existing accounts, etc
    return res.status(204).send()
  }
})

router.get('/:userId', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  if (!session.user?.adminMode && session.user.id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  if (session.user.id === '_superadmin') return res.send(superadmin)
  let storage = storages.globalStorage
  if (session.user.id === req.params.userId && session.user.os && session.organization) {
    const org = await storages.globalStorage.getOrganization(session.organization.id)
    if (!org) return res.status(401).send('Organization does not exist anymore')
    storage = await storages.createOrgStorage(org) ?? storage
  }
  const user = await storage.getUser(req.params.userId)
  if (!user) return res.status(404).send()
  user.isAdmin = config.admins.includes(user.email)
  res.json(user)
})

// Update some parts of a user as himself
const adminKeys = ['maxCreatedOrgs', 'email', '2FA']
router.patch('/:userId', rejectCoreIdUser, async (req, res, next) => {
  const logContext: EventLogContext = { req }

  const session = reqSessionAuthenticated(req)
  if (!session.user?.adminMode && session.user.id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)

  const { body: patch } = (await import('#doc/users/patch-req/index.ts')).returnValid(req, { name: 'req' })

  const adminKey = Object.keys(req.body).find(key => adminKeys.includes(key))
  if (adminKey && !session.user?.adminMode) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)

  if (patch.plannedDeletion) {
    if (config.userSelfDelete) {
      if (!session.user?.adminMode && session.user.id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
    } else {
      if (!session.user?.adminMode) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
    }
  }

  const patchedUser = await storages.globalStorage.patchUser(req.params.userId, patch, session.user)

  if (patchedUser.name !== session.user.name) {
    postUserIdentityWebhook(patchedUser)
  }

  eventsLog.info('sd.user.patch', `user was patched ${patchedUser.name} (${patchedUser.id})`, logContext)

  const link = reqSiteUrl(req) + '/simple-directory/login?email=' + encodeURIComponent(session.user.email)
  if (patch.plannedDeletion) {
    await sendMail('plannedDeletion', reqI18n(req).messages, session.user.email, {
      link,
      user: session.user.name,
      plannedDeletion: __date(req, patch.plannedDeletion).format('L'),
      cause: ''
    })
  }

  await mongo.limits.updateOne({ type: 'user', id: patchedUser.id }, { $set: { name: patchedUser.name } })

  // update session info
  await keepalive(req, res)

  res.send(patchedUser)
})

router.delete('/:userId/plannedDeletion', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const session = reqSessionAuthenticated(req)

  if (!session.user?.adminMode && session.user.id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  const patch = { plannedDeletion: null }

  await storages.globalStorage.patchUser(req.params.userId, patch, session.user)

  // update session info
  await keepalive(req, res)

  eventsLog.info('sd.user.cancelDeletion', 'user cancelled their planned deletion', logContext)

  res.status(204).send()
})

router.delete('/:userId', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const session = reqSessionAuthenticated(req)

  if (config.userSelfDelete) {
    if (!session.user?.adminMode && session.user.id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  } else {
    if (!session.user?.adminMode) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  }

  await storages.globalStorage.deleteUser(req.params.userId)

  eventsLog.info('sd.user.del', `user was deleted ${req.params.userId}`, logContext)

  deleteIdentityWebhook('user', req.params.userId)
  res.status(204).send()
})

// Change password of a user using an action token sent in a mail
router.post('/:userId/password', rejectCoreIdUser, async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const { body, query } = (await import('#doc/users/post-password-req/index.ts')).returnValid(req, { name: 'req' })

  let decoded
  try {
    decoded = await session.verifyToken(query.action_token)
  } catch (err) {
    return res.status(401).send(reqI18n(req).messages.errors.invalidToken)
  }
  if (decoded.id !== req.params.userId) return res.status(401).send('wrong user id in token')
  if (decoded.action !== 'changePassword') return res.status(401).send('wrong action for this token')
  if (!validatePassword(body.password)) return res.status(400).send(reqI18n(req).messages.errors.malformedPassword)
  const storedPassword = await hashPassword(body.password)
  await storages.globalStorage.patchUser(req.params.userId, { password: storedPassword })

  eventsLog.info('sd.user.change-password', `user changed password ${req.params.userId}`, logContext)

  res.status(204).send()
})

// Change host of a user using an action token sent in a mail
router.post('/:userId/host', rejectCoreIdUser, async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const { body, query } = (await import('#doc/users/post-host-req/index.ts')).returnValid(req, { name: 'req' })

  const storage = storages.globalStorage
  let decoded
  try {
    decoded = await session.verifyToken(query.action_token)
  } catch (err) {
    return res.status(401).send(reqI18n(req).messages.errors.invalidToken)
  }
  if (decoded.id !== req.params.userId) return res.status(401).send('wrong user id in token')
  if (decoded.action !== 'changeHost') return res.status(401).send('wrong action for this token')
  await storage.patchUser(req.params.userId, { host: body.host, oauth: null, oidc: null, saml: null })

  eventsLog.info('sd.user.change-host', `user changed host ${req.params.userId}`, logContext)

  if (storage.getPassword) {
    const storedPassword = await storage.getPassword(decoded.id)
    if (!storedPassword) {
      const payload = {
        id: decoded.id,
        email: decoded.email,
        action: 'changePassword'
      }
      const token = await signToken(payload, config.jwtDurations.initialToken)
      res.send(token)
    }
  }

  res.status(204).send()
})

export default router
