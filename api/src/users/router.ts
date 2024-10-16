import { Router } from 'express'
import config from '#config'
const shortid = require('shortid')
const emailValidator = require('email-validator')
const userName = require('../utils/user-name')
const findUtils = require('../utils/find')
const tokens = require('../utils/tokens')
const passwords = require('../utils/passwords')
const webhooks = require('../webhooks')
const mails = require('../mails')
const storages = require('../storages')
const limits = require('../utils/limits')
const { unshortenInvit } = require('../utils/invitations')
const defaultConfig = require('../../config/default.js')
const { send: sendNotification } = require('../utils/notifications')

const router = Router()

const rejectCoreIdUser = (req, res, next) => {
  if (req.user?.coreIdProvider) return res.status(403).send('This route is not available for users with a core identity provider')
  next()
}

// Get the list of users
router.get('', async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  const listMode = config.listUsersMode || config.listEntitiesMode
  if (listMode === 'authenticated' && !req.user) return res.send({ results: [], count: 0 })
  if (listMode === 'admin' && !(req.user && req.user.adminMode)) return res.send({ results: [], count: 0 })

  const params = { ...findUtils.pagination(req.query), sort: findUtils.sort(req.query.sort) }

  // Only service admins can request to see all field. Other users only see id/name
  const allFields = req.query.allFields === 'true'
  if (allFields) {
    if (!req.user || !req.user.adminMode) return res.status(403).send(req.messages.errors.permissionDenied)
  } else {
    params.select = ['id', 'name']
  }

  if (req.query) {
    if (req.query.ids) params.ids = req.query.ids.split(',')
    if (req.query.q) params.q = req.query.q
  }
  const users = await req.app.get('storage').findUsers(params)

  eventsLog.info('sd.list-users', 'list users', logContext)

  res.json(users)
})

const createKeys = ['firstName', 'lastName', 'email', 'password', 'birthday', 'createOrganization']
// TODO: block when onlyCreateInvited is true ?
router.post('', async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.body || !req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  if (!emailValidator.validate(req.body.email)) return res.status(400).send(req.messages.errors.badEmail)
  const invalidKey = Object.keys(req.body).find(key => !createKeys.concat(adminKeys).includes(key))
  if (invalidKey) return res.status(400).send(`Attribute ${invalidKey} is not accepted`)

  const storage = req.app.get('storage')

  // used to create a user and accept a member invitation at the same time
  // if the invitation is not valid, better not to proceed with the user creation
  let invit, orga
  if (req.query.invit_token) {
    try {
      invit = unshortenInvit(await tokens.verify(req.app.get('keys'), req.query.invit_token))
    } catch (err) {
      return res.status(400).send(err.name === 'TokenExpiredError' ? req.messages.errors.expiredInvitationToken : req.messages.errors.invalidInvitationToken)
    }
    orga = await storage.getOrganization(invit.id)
    if (!orga) return res.status(400).send(req.messages.errors.orgaUnknown)
    logContext.account = { type: 'organization', id: orga.id, name: orga.name, department: invit.department, departmentName: invit.departmentName }
    if (invit.email !== req.body.email) return res.status(400).send(req.messages.errors.badEmail)
  } else if (config.onlyCreateInvited) {
    return res.status(400).send('users can only be created from an invitation')
  }

  // create user
  const newUser = {
    email: req.body.email,
    id: shortid.generate(),
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    emailConfirmed: false
  }
  if (req.site) newUser.host = req.site.host
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
      return res.status(400).send(req.messages.errors.malformedPassword)
    }
    newUser.password = await passwords.hashPassword(req.body.password)
  }

  const user = await req.app.get('storage').getUserByEmail(req.body.email, req.site)

  // email is already taken, send a conflict email
  const link = req.query.redirect || config.defaultLoginRedirect || req.publicBaseUrl
  if (user && user.emailConfirmed !== false) {
    const linkUrl = new URL(link)
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'conflict',
      messages: req.messages,
      to: req.body.email,
      params: { host: linkUrl.host, origin: linkUrl.origin }
    })
    return res.status(204).send()
  }

  // the user was invited in alwaysAcceptInvitations mode, but the membership was revoked
  if (invit && config.alwaysAcceptInvitation && (!user || !user.organizations.find(o => o.id === orga.id))) {
    return res.status(400).send(req.messages.errors.invalidInvitationToken)
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
      if (limit.consumption >= limit.limit && limit.limit > 0) return res.status(400).send(req.messages.errors.maxNbMembers)
    }
    eventsLog.info('sd.user.accept-invite', 'user accepted an invitation', logContext)
    await storage.addMember(orga, newUser, invit.role, invit.department)
    sendNotification({
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: req.__all('notifications.acceptedInvitation', { name: newUser.name, email: newUser.email, orgName: orga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    if (storage.db) await limits.setNbMembers(storage.db, orga.id)
  }

  if (invit) {
    // no need to confirm email if the user already comes from an invitation link
    // we already created the user with emailConfirmed=true
    const payload = { ...tokens.getPayload(newUser), temporary: true }
    const linkUrl = tokens.prepareCallbackUrl(req, payload, req.query.redirect, tokens.getDefaultUserOrg(newUser, invit && invit.id, invit && invit.department))
    return res.send(linkUrl)
  } else {
    // prepare same link and payload as for a passwordless authentication
    // the user will be validated and authenticated at the same time by the token_callback route
    const payload = { ...tokens.getPayload(newUser), emailConfirmed: true, temporary: true }
    const linkUrl = tokens.prepareCallbackUrl(req, payload, req.query.redirect, tokens.getDefaultUserOrg(newUser, req.query.org, req.query.dep))
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'creation',
      messages: req.messages,
      to: req.body.email,
      params: { link: linkUrl.href, host: linkUrl.host, origin: linkUrl.origin }
    })
    // this route doesn't return any info to its caller to prevent giving any indication of existing accounts, etc
    return res.status(204).send()
  }
})

router.get('/:userId', async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.adminMode && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)
  if (req.user.id === '_superadmin') return res.json(req.user)
  let storage = req.app.get('storage')
  if (req.user.id === req.params.userId && req.user.orgStorage && req.user.organization) {
    const org = await req.app.get('storage').getOrganization(req.user.organization.id)
    if (!org) return res.status(401).send('Organization does not exist anymore')
    storage = await storages.createStorage(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
  }
  const user = await storage.getUser({ id: req.params.userId })
  if (!user) return res.status(404).send()
  user.isAdmin = config.admins.includes(user.email)
  user.avatarUrl = req.publicBaseUrl + '/api/avatars/user/' + user.id + '/avatar.png'
  res.json(user)
})

// Update some parts of a user as himself
const patchKeys = ['firstName', 'lastName', 'birthday', 'ignorePersonalAccount', 'defaultOrg', 'defaultDep', 'plannedDeletion']
const adminKeys = ['maxCreatedOrgs', 'email', '2FA']
router.patch('/:userId', rejectCoreIdUser, async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.user) return res.status(401).send()
  if (!req.user.adminMode && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)

  const unpatchableKey = Object.keys(req.body).find(key => !patchKeys.concat(adminKeys).includes(key))
  if (unpatchableKey) return res.status(400).send('Only some parts of the user can be modified through this route')
  const adminKey = Object.keys(req.body).find(key => adminKeys.includes(key))
  if (adminKey && !req.user.adminMode) return res.status(403).send(req.messages.errors.permissionDenied)

  const patch = req.body
  const name = userName({ ...req.user, ...patch }, true)
  if (name !== req.user.name) {
    patch.name = name
    webhooks.postIdentity('user', { ...req.user, ...patch })
  }

  if (patch.plannedDeletion) {
    if (config.userSelfDelete) {
      if (!req.user.adminMode && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)
    } else {
      if (!req.user.adminMode) return res.status(403).send(req.messages.errors.permissionDenied)
    }
  }

  const patchedUser = await req.app.get('storage').patchUser(req.params.userId, patch, req.user)

  eventsLog.info('sd.user.patch', `user was patched ${patchedUser.name} (${patchedUser.id})`, logContext)

  const link = req.publicBaseUrl + '/login?email=' + encodeURIComponent(req.user.email)
  const linkUrl = new URL(link)
  if (patch.plannedDeletion) {
    await mails.send({
      transport: req.app.get('mailTransport'),
      key: 'plannedDeletion',
      messages: req.messages,
      to: req.user.email,
      params: {
        link,
        host: linkUrl.host,
        origin: linkUrl.origin,
        user: req.user.name,
        plannedDeletion: req.localeDate(patch.plannedDeletion).format('L'),
        cause: ''
      }
    })
  }

  if (req.app.get('storage').db) await req.app.get('storage').db.collection('limits').updateOne({ type: 'user', id: patchedUser.id }, { $set: { name: patchedUser.name } })
  patchedUser.avatarUrl = req.publicBaseUrl + '/api/avatars/user/' + patchedUser.id + '/avatar.png'

  // update session info
  await tokens.keepalive(req, res)

  res.send(patchedUser)
})

router.delete('/:userId/plannedDeletion', async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.user) return res.status(401).send()
  if (!req.user.adminMode && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)
  const patch = { plannedDeletion: null }

  await req.app.get('storage').patchUser(req.params.userId, patch, req.user)

  // update session info
  await tokens.keepalive(req, res)

  eventsLog.info('sd.user.cancelDeletion', 'user cancelled their planned deletion', logContext)

  res.status(204).send()
})

router.delete('/:userId', async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.user) return res.status(401).send()
  if (config.userSelfDelete) {
    if (!req.user.adminMode && req.user.id !== req.params.userId) return res.status(403).send(req.messages.errors.permissionDenied)
  } else {
    if (!req.user.adminMode) return res.status(403).send(req.messages.errors.permissionDenied)
  }

  await req.app.get('storage').deleteUser(req.params.userId)

  eventsLog.info('sd.user.del', `user was deleted ${req.params.userId}`, logContext)

  webhooks.deleteIdentity('user', req.params.userId)
  res.status(204).send()
})

// Change password of a user using an action token sent in a mail
router.post('/:userId/password', rejectCoreIdUser, async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!req.body.password) return res.status(400).send()
  const actionToken = req.query.action_token
  if (!actionToken) return res.status(401).send('action_token param is required')
  let decoded
  try {
    decoded = await tokens.verify(req.app.get('keys'), actionToken)
  } catch (err) {
    return res.status(401).send(req.messages.errors.invalidToken)
  }
  if (decoded.id !== req.params.userId) return res.status(401).send('wrong user id in token')
  if (decoded.action !== 'changePassword') return res.status(401).send('wrong action for this token')
  if (!passwords.validate(req.body.password)) return res.status(400).send(req.messages.errors.malformedPassword)
  const storedPassword = await passwords.hashPassword(req.body.password)
  await req.app.get('storage').patchUser(req.params.userId, { password: storedPassword })

  eventsLog.info('sd.user.change-password', `user changed password ${req.params.userId}`, logContext)

  res.status(204).send()
})

// Change host of a user using an action token sent in a mail
router.post('/:userId/host', rejectCoreIdUser, async (req, res, next) => {
  const eventsLog = (await import('@data-fair/lib/express/events-log.js')).default
  /** @type {import('@data-fair/lib/express/events-log.js').EventLogContext} */
  const logContext = { req }

  const storage = req.app.get('storage')
  if (!req.body.host) return res.status(400).send()
  const actionToken = req.query.action_token
  if (!actionToken) return res.status(401).send('action_token param is required')
  let decoded
  try {
    decoded = await tokens.verify(req.app.get('keys'), actionToken)
  } catch (err) {
    return res.status(401).send(req.messages.errors.invalidToken)
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
    const token = tokens.sign(req.app.get('keys'), payload, config.jwtDurations.initialToken)
    res.send(token)
  } else {
    res.status(204).send()
  }
})

module.exports = router
