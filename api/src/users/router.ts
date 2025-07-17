import { type Organization, type UserWritable } from '#types'
import { Router, type RequestHandler } from 'express'
import config, { superadmin } from '#config'
import { reqSessionAuthenticated, mongoPagination, mongoSort, session, reqSiteUrl, reqSession, httpError } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import { nanoid } from 'nanoid'
import eventsQueue from '#events-queue'
import { reqI18n, __all, __date } from '#i18n'
import storages from '#storages'
import mongo from '#mongo'
import emailValidator from 'email-validator'
import type { FindUsersParams } from '../storages/interface.ts'
import { validatePassword, hashPassword, unshortenInvit, reqSite, deleteIdentityWebhook, sendMailI18n, getOrgLimits, setNbMembersLimit, getTokenPayload, getDefaultUserOrg, prepareCallbackUrl, postUserIdentityWebhook, keepalive, signToken, getRedirectSite, checkPassword } from '#services'

const router = Router()

const rejectCoreIdUser: RequestHandler = (req, res, next) => {
  const session = reqSession(req)
  if (session.user?.idp) throw httpError(403, 'This route is not available for users with a core identity provider')
  next()
}

// Get the list of users
router.get('', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const session = reqSession(req)
  const user = session.user

  const listMode = config.listUsersMode || config.listEntitiesMode
  if (listMode === 'authenticated' && !user) return res.send({ results: [], count: 0 })
  if (listMode === 'admin' && !user?.adminMode) return res.send({ results: [], count: 0 })

  const params: FindUsersParams = { ...mongoPagination(req.query), sort: mongoSort(req.query.sort) }

  // Only service admins can request to see all field. Other users only see id/name
  const allFields = req.query.allFields === 'true'
  if (allFields) {
    if (user?.adminMode) {
      // ok
    } else if (config.siteAdmin && session.siteRole === 'admin') {
      const site = await reqSite(req)
      if (!site || site.host !== req.query.host || site.path !== req.query.path) {
        throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
      }
    } else {
      throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
    }
  } else {
    params.select = ['id', 'name']
  }

  if (typeof req.query.host === 'string') params.host = req.query.host
  if (typeof req.query.path === 'string') params.path = req.query.path

  if (typeof req.query.ids === 'string') params.ids = req.query.ids.split(',')
  if (typeof req.query.q === 'string') params.q = req.query.q

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
  if (query.invit_token) {
    try {
      invit = unshortenInvit(await session.verifyToken(query.invit_token))
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
  if (site) {
    if (['onlyBackOffice', 'onlyOtherSite', undefined].includes(site.authMode)) {
      throw httpError(400, 'Cannot create a user on a secondary site')
    }
    newUser.host = site.host
    if (site.path) newUser.path = site.path
  }

  if (invit) {
    newUser.emailConfirmed = true
    newUser.defaultOrg = invit.id
    if (invit.department) newUser.defaultDep = invit.department
    newUser.ignorePersonalAccount = true
  }

  // password is optional as we support passwordless auth
  if (body.password) {
    const passwordValidationError = await validatePassword(req, req.body.password)
    if (passwordValidationError) {
      return res.status(400).send(passwordValidationError)
    }
    newUser.password = await hashPassword(body.password)
    newUser.passwordUpdate = { last: new Date().toISOString() }
  }

  const user = await storages.globalStorage.getUserByEmail(body.email, await reqSite(req))

  // email is already taken, send a conflict email
  const link = query.redirect || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory'
  if (user && user.emailConfirmed !== false) {
    const linkUrl = new URL(link)
    await sendMailI18n('conflict', reqI18n(req).messages, body.email, { host: linkUrl.host, origin: linkUrl.origin })
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

  const linkSite = await getRedirectSite(req, link)
  const createdUser = await storage.createUser(newUser, undefined, linkSite)
  eventsLog.info('sd.user.create', 'user was created', logContext)
  if (site) {
    eventsQueue?.pushEvent({
      sender: { ...site.owner, role: 'admin' },
      topic: { key: 'simple-directory:user-created:' + site._id },
      title: (invit && !config.alwaysAcceptInvitation && orga)
        ? __all('notifications.userCreatedOrg', { host: site.host, name: createdUser.name, email: createdUser.email, orgName: orga.name + (invit.department ? ' / ' + invit.department : '') })
        : __all('notifications.userCreated', { host: site.host, name: createdUser.name, email: createdUser.email })
    })
  }

  if (invit && !config.alwaysAcceptInvitation && orga) {
    const limits = await getOrgLimits(orga)
    if (limits.store_nb_members.limit > 0 && limits.store_nb_members.consumption >= limits.store_nb_members.limit) {
      return res.status(400).send(reqI18n(req).messages.errors.maxNbMembers)
    }
    eventsLog.info('sd.user.accept-invite', 'user accepted an invitation', logContext)
    await storage.addMember(orga, createdUser, invit.role, invit.department)
    eventsQueue?.pushEvent({
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: __all('notifications.acceptedInvitation', { name: createdUser.name, email: createdUser.email, orgName: orga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    await setNbMembersLimit(orga.id)
  }

  if (invit) {
    // no need to confirm email if the user already comes from an invitation link
    // we already created the user with emailConfirmed=true
    const payload = getTokenPayload(createdUser, site)
    const linkUrl = await prepareCallbackUrl(req, payload, query.redirect, getDefaultUserOrg(createdUser, invit && invit.id, invit && invit.department, invit && invit.role))
    return res.send(linkUrl)
  } else {
    // prepare same link and payload as for a passwordless authentication
    // the user will be validated and authenticated at the same time by the token_callback route
    const payload = { ...getTokenPayload(createdUser, site), emailConfirmed: true }
    const linkUrl = await prepareCallbackUrl(req, payload, query.redirect, getDefaultUserOrg(createdUser, query.org, query.dep))
    await sendMailI18n('creation', reqI18n(req).messages, body.email, { link: linkUrl.href })
    // this route doesn't return any info to its caller to prevent giving any indication of existing accounts, etc
    return res.status(204).send()
  }
})

router.get('/:userId', async (req, res, next) => {
  const session = reqSessionAuthenticated(req)
  if (!session.user?.adminMode && session.user.id !== req.params.userId) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  if (session.user.id === '_superadmin') return res.send(superadmin)
  let storage = storages.globalStorage
  if (session.user.id === req.params.userId) {
    storage = await storages.getSessionStorage(session)
  }
  const user = await storage.getUser(req.params.userId)
  if (!user) return res.status(404).send()
  res.json(user)
})

// Update some parts of a user as himself
const adminKeys = ['maxCreatedOrgs', 'email', '2FA']
router.patch('/:userId', rejectCoreIdUser, async (req, res, next) => {
  const logContext: EventLogContext = { req }

  const session = reqSessionAuthenticated(req)
  if (!session.user?.adminMode && session.user.id !== req.params.userId) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)

  const { body: patch } = (await import('#doc/users/patch-req/index.ts')).returnValid(req, { name: 'req' })

  const adminKey = Object.keys(req.body).find(key => adminKeys.includes(key))
  if (adminKey && !session.user?.adminMode) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)

  if (patch.plannedDeletion) {
    if (config.userSelfDelete) {
      if (!session.user?.adminMode && session.user.id !== req.params.userId) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
    } else {
      if (!session.user?.adminMode) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
    }
  }

  const patchedUser = await storages.globalStorage.patchUser(req.params.userId, patch, session.user)

  if (patchedUser.name !== session.user.name) {
    postUserIdentityWebhook(patchedUser)
  }

  eventsLog.info('sd.user.patch', `user was patched ${patchedUser.name} (${patchedUser.id})`, logContext)

  const link = reqSiteUrl(req) + '/simple-directory/login?email=' + encodeURIComponent(session.user.email)
  if (patch.plannedDeletion) {
    await sendMailI18n('plannedDeletion', reqI18n(req).messages, session.user.email, {
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

  if (!session.user?.adminMode && session.user.id !== req.params.userId) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
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
    if (!session.user?.adminMode && session.user.id !== req.params.userId) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  } else {
    if (!session.user?.adminMode) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
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
  const passwordValidationError = await validatePassword(req, body.password)
  if (passwordValidationError) return res.status(400).send(passwordValidationError)

  const storage = storages.globalStorage
  let samePassword = false
  if (storage.getPassword) {
    const storedPassword = await storage.getPassword(req.params.userId)
    samePassword = await checkPassword(body.password, storedPassword)
  } else if (storage.checkPassword) {
    samePassword = await storage.checkPassword(req.params.userId, body.password)
  }

  if (samePassword) return res.status(400).send(reqI18n(req).messages.errors.samePassword)

  const newStoredPassword = await hashPassword(body.password)

  await storage.patchUser(req.params.userId, { password: newStoredPassword, 'passwordUpdate.last': new Date().toISOString(), 'passwordUpdate.force': null })

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

router.delete('/:userId/sessions/:sessionId', async (req, res, next) => {
  const logContext: EventLogContext = { req }
  const session = reqSessionAuthenticated(req)

  if (!session.user?.adminMode && session.user.id !== req.params.userId) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  await storages.globalStorage.deleteUserSession(req.params.userId, req.params.sessionId)
  eventsLog.info('sd.user.cancelDeleteSession', 'user cancelled a session', logContext)
  await keepalive(req, res)
  res.status(204).send()
})

export default router
