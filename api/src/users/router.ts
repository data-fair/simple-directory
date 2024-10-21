import { Router } from 'express'
import config from '#config'
import { reqUser, mongoPagination, mongoSort } from '@data-fair/lib-express'
import { nanoid } from 'nanoid'
import userName from '../utils/user-name.ts'
import { pushEvent } from '@data-fair/lib-node/events-queue.js'
const findUtils = require('../utils/find')
const tokens = require('../utils/tokens')
const passwords = require('../utils/passwords')
const webhooks = require('../webhooks')
const mails = require('../mails')
import storages from '#storages'
const limits = require('../utils/limits')
const { unshortenInvit } = require('../utils/invitations')
const defaultConfig = require('../../config/default.js')

const router = Router()

const rejectCoreIdUser = (req, res, next) => {
  if (reqUser(req)?.idp) return res.status(403).send('This route is not available for users with a core identity provider')
  next()
}

// Get the list of users
router.get('', async (req, res, next) => {
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

  const listMode = config.listUsersMode || config.listEntitiesMode
  if (listMode === 'authenticated' && !reqUser(req)) return res.send({ results: [], count: 0 })
  if (listMode === 'admin' && !reqUser(req)?.adminMode) return res.send({ results: [], count: 0 })

  const params = { ...mongoPagination(req.query), sort: mongoSort(req.query.sort) }

  // Only service admins can request to see all field. Other users only see id/name
  const allFields = req.query.allFields === 'true'
  if (allFields) {
    if (!reqUser(req)?.adminMode) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  } else {
    params.select = ['id', 'name']
  }

  if (req.query) {
    if (req.query.ids) params.ids = req.query.ids.split(',')
    if (req.query.q) params.q = req.query.q
  }
  const users = await storages.globalStorage.findUsers(params)

  eventsLog.info('sd.list-users', 'list users', logContext)

  res.json(users)
})

const createKeys = ['firstName', 'lastName', 'email', 'password', 'birthday', 'createOrganization']
// TODO: block when onlyCreateInvited is true ?
router.post('', async (req, res, next) => {
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.body || !req.body.email) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  const invalidKey = Object.keys(req.body).find(key => !createKeys.concat(adminKeys).includes(key))
  if (invalidKey) return res.status(400).send(`Attribute ${invalidKey} is not accepted`)

  const storage = storages.globalStorage

  // used to create a user and accept a member invitation at the same time
  // if the invitation is not valid, better not to proceed with the user creation
  let invit, orga
  if (req.query.invit_token) {
    try {
      invit = unshortenInvit(await session.verifyToken(req.query.invit_token))
    } catch (err) {
      return res.status(400).send(err.name === 'TokenExpiredError' ? reqI18n(req).messages.errors.expiredInvitationToken : reqI18n(req).messages.errors.invalidInvitationToken)
    }
    orga = await storage.getOrganization(invit.id)
    if (!orga) return res.status(400).send(reqI18n(req).messages.errors.orgaUnknown)
    logContext.account = { type: 'organization', id: orga.id, name: orga.name, department: invit.department, departmentName: invit.departmentName }
    if (invit.email !== req.body.email) return res.status(400).send(reqI18n(req).messages.errors.badEmail)
  } else if (config.onlyCreateInvited) {
    return res.status(400).send('users can only be created from an invitation')
  }

  // create user
  const newUser = {
    email: req.body.email,
    id: nanoid(),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    emailConfirmed: false
  }
  if (await reqSite(req)) newUser.host = await reqSite(req).host
  newUser.name = userName(newUser)
  logContext.user = newUser
  if (invit) {
    newUser.emailConfirmed = true
    newUser.defaultOrg = invit.id
    if (invit.department) newUser.defaultDep = invit.department
    newUser.ignorePersonalAccount = true
  }

  // password is optional as we support passwordless auth
  if (![undefined, null].includes(req.body.password)) {
    if (!passwords.validate(req.body.password)) {
      return res.status(400).send(reqI18n(req).messages.errors.malformedPassword)
    }
    newUser.password = await passwords.hashPassword(req.body.password)
  }

  const user = await storages.globalStorage.getUserByEmail(req.body.email, await reqSite(req))

  // email is already taken, send a conflict email
  const link = req.query.redirect || config.defaultLoginRedirect || reqSiteUrl(req) + '/simple-directory'
  if (user && user.emailConfirmed !== false) {
    const linkUrl = new URL(link)
    await sendMail('conflict', reqI18n(req).messages, req.body.email, { host: linkUrl.host, origin: linkUrl.origin })
    return res.status(204).send()
  }

  // the user was invited in alwaysAcceptInvitations mode, but the membership was revoked
  if (invit && config.alwaysAcceptInvitation && (!user || !user.organizations.find(o => o.id === orga.id))) {
    return res.status(400).send(reqI18n(req).messages.errors.invalidInvitationToken)
  }

  // Re-create a user that was never validated.. first clean temporary user
  if (user && user.emailConfirmed === false) {
    if (user.organizations && invit) {
      // This user was created empty from an invitation in 'alwaysAcceptInvitations' mode
      newUser.id = user.id
      newUser.organizations = user.organizations
    } else {
      eventsLog.info('sd.user.del-temp-user', 'temp user was deleted/recreated', logContext)
      await storage.deleteUser(user.id)
    }
  }

  await storage.createUser(newUser, null, new URL(link).host)
  eventsLog.info('sd.user.create', 'user was created', logContext)

  if (invit && !config.alwaysAcceptInvitation) {
    if (storage.db) {
      const consumer = { type: 'organization', id: orga.id }
      const limit = await limits.get(storage.db, consumer, 'store_nb_members')
      if (limit.consumption >= limit.limit && limit.limit > 0) return res.status(400).send(reqI18n(req).messages.errors.maxNbMembers)
    }
    eventsLog.info('sd.user.accept-invite', 'user accepted an invitation', logContext)
    await storage.addMember(orga, newUser, invit.role, invit.department)
    pushEvent({
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: __all('notifications.acceptedInvitation', { name: newUser.name, email: newUser.email, orgName: orga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    if (storage.db) await limits.setNbMembers(storage.db, orga.id)
  }

  if (invit) {
    // no need to confirm email if the user already comes from an invitation link
    // we already created the user with emailConfirmed=true
    const payload = { ...tokens.getPayload(newUser), temporary: true }
    const linkUrl = await tokens.prepareCallbackUrl(req, payload, req.query.redirect, tokens.getDefaultUserOrg(newUser, invit && invit.id, invit && invit.department))
    return res.send(linkUrl)
  } else {
    // prepare same link and payload as for a passwordless authentication
    // the user will be validated and authenticated at the same time by the token_callback route
    const payload = { ...tokens.getPayload(newUser), emailConfirmed: true, temporary: true }
    const linkUrl = await tokens.prepareCallbackUrl(req, payload, req.query.redirect, tokens.getDefaultUserOrg(newUser, req.query.org, req.query.dep))
    await sendMail('creation', reqI18n(req).messages, req.body.email, { link: linkUrl.href })
    // this route doesn't return any info to its caller to prevent giving any indication of existing accounts, etc
    return res.status(204).send()
  }
})

router.get('/:userId', async (req, res, next) => {
  if (!reqUser(req)) return res.status(401).send()
  if (!reqUser(req)?.adminMode && reqUser(req).id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  if (reqUser(req).id === '_superadmin') return res.json(reqUser(req))
  let storage = storages.globalStorage
  if (reqUser(req).id === req.params.userId && reqUser(req).orgStorage && reqUser(req).organization) {
    const org = await storages.globalStorage.getOrganization(reqUser(req).organization.id)
    if (!org) return res.status(401).send('Organization does not exist anymore')
    storage = await storages.createStorage(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }
  const user = await storage.getUser({ id: req.params.userId })
  if (!user) return res.status(404).send()
  user.isAdmin = config.admins.includes(user.email)
  res.json(user)
})

// Update some parts of a user as himself
const patchKeys = ['firstName', 'lastName', 'birthday', 'ignorePersonalAccount', 'defaultOrg', 'defaultDep', 'plannedDeletion']
const adminKeys = ['maxCreatedOrgs', 'email', '2FA']
router.patch('/:userId', rejectCoreIdUser, async (req, res, next) => {
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!reqUser(req)) return res.status(401).send()
  if (!reqUser(req)?.adminMode && reqUser(req).id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)

  const unpatchableKey = Object.keys(req.body).find(key => !patchKeys.concat(adminKeys).includes(key))
  if (unpatchableKey) return res.status(400).send('Only some parts of the user can be modified through this route')
  const adminKey = Object.keys(req.body).find(key => adminKeys.includes(key))
  if (adminKey && !reqUser(req)?.adminMode) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)

  const patch = req.body
  const name = userName({ ...reqUser(req), ...patch }, true)
  if (name !== reqUser(req).name) {
    patch.name = name
    webhooks.postIdentity('user', { ...reqUser(req), ...patch })
  }

  if (patch.plannedDeletion) {
    if (config.userSelfDelete) {
      if (!reqUser(req)?.adminMode && reqUser(req).id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
    } else {
      if (!reqUser(req)?.adminMode) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
    }
  }

  const patchedUser = await storages.globalStorage.patchUser(req.params.userId, patch, reqUser(req))

  eventsLog.info('sd.user.patch', `user was patched ${patchedUser.name} (${patchedUser.id})`, logContext)

  const link = reqSiteUrl(req) + '/simple-directory/login?email=' + encodeURIComponent(reqUser(req).email)
  const linkUrl = new URL(link)
  if (patch.plannedDeletion) {
    await sendMail('plannedDeletion', reqI18n(req).messages, reqUser(req).email, {
      link,
      user: reqUser(req).name,
      plannedDeletion: req.localeDate(patch.plannedDeletion).format('L'),
      cause: ''
    })
  }

  if (storages.globalStorage.db) await storages.globalStorage.db.collection('limits').updateOne({ type: 'user', id: patchedUser.id }, { $set: { name: patchedUser.name } })

  // update session info
  await tokens.keepalive(req, res)

  res.send(patchedUser)
})

router.delete('/:userId/plannedDeletion', async (req, res, next) => {
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!reqUser(req)) return res.status(401).send()
  if (!reqUser(req)?.adminMode && reqUser(req).id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  const patch = { plannedDeletion: null }

  await storages.globalStorage.patchUser(req.params.userId, patch, reqUser(req))

  // update session info
  await tokens.keepalive(req, res)

  eventsLog.info('sd.user.cancelDeletion', 'user cancelled their planned deletion', logContext)

  res.status(204).send()
})

router.delete('/:userId', async (req, res, next) => {
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!reqUser(req)) return res.status(401).send()
  if (config.userSelfDelete) {
    if (!reqUser(req)?.adminMode && reqUser(req).id !== req.params.userId) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  } else {
    if (!reqUser(req)?.adminMode) return res.status(403).send(reqI18n(req).messages.errors.permissionDenied)
  }

  await storages.globalStorage.deleteUser(req.params.userId)

  eventsLog.info('sd.user.del', `user was deleted ${req.params.userId}`, logContext)

  webhooks.deleteIdentity('user', req.params.userId)
  res.status(204).send()
})

// Change password of a user using an action token sent in a mail
router.post('/:userId/password', rejectCoreIdUser, async (req, res, next) => {
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.body.password) return res.status(400).send()
  const actionToken = req.query.action_token
  if (!actionToken) return res.status(401).send('action_token param is required')
  let decoded
  try {
    decoded = await session.verifyToken(actionToken)
  } catch (err) {
    return res.status(401).send(reqI18n(req).messages.errors.invalidToken)
  }
  if (decoded.id !== req.params.userId) return res.status(401).send('wrong user id in token')
  if (decoded.action !== 'changePassword') return res.status(401).send('wrong action for this token')
  if (!passwords.validate(req.body.password)) return res.status(400).send(reqI18n(req).messages.errors.malformedPassword)
  const storedPassword = await passwords.hashPassword(req.body.password)
  await storages.globalStorage.patchUser(req.params.userId, { password: storedPassword })

  eventsLog.info('sd.user.change-password', `user changed password ${req.params.userId}`, logContext)

  res.status(204).send()
})

// Change host of a user using an action token sent in a mail
router.post('/:userId/host', rejectCoreIdUser, async (req, res, next) => {
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

  const storage = storages.globalStorage
  if (!req.body.host) return res.status(400).send()
  const actionToken = req.query.action_token
  if (!actionToken) return res.status(401).send('action_token param is required')
  let decoded
  try {
    decoded = await session.verifyToken(actionToken)
  } catch (err) {
    return res.status(401).send(reqI18n(req).messages.errors.invalidToken)
  }
  if (decoded.id !== req.params.userId) return res.status(401).send('wrong user id in token')
  if (decoded.action !== 'changeHost') return res.status(401).send('wrong action for this token')
  await storage.patchUser(req.params.userId, { host: req.body.host, oauth: null, oidc: null, saml: null })

  eventsLog.info('sd.user.change-host', `user changed host ${req.params.userId}`, logContext)

  const storedPassword = await storage.getPassword(decoded.id)
  if (!storedPassword) {
    const payload = {
      id: decoded.id,
      email: decoded.email,
      action: 'changePassword'
    }
    const token = await tokens.sign(payload, config.jwtDurations.initialToken)
    res.send(token)
  } else {
    res.status(204).send()
  }
})

export default router
