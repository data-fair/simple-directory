const express = require('express')
const shortid = require('shortid')
const config = require('config')
const asyncWrap = require('../utils/async-wrap')
const findUtils = require('../utils/find')
const webhooks = require('../webhooks')
const limits = require('../utils/limits')
const tokens = require('../utils/tokens')
const storageFactory = require('../storages')
const passwordsUtils = require('../utils/passwords')
const defaultConfig = require('../../config/default.js')

const router = module.exports = express.Router()

// Either a super admin, or an admin of the current organization
function isAdmin (req) {
  return req.user.adminMode || (req.user.organizations || []).find(o => o.id === req.params.organizationId && o.role === 'admin')
}

// Either a super admin, or a member of the current organization
function isMember (req) {
  return req.user.adminMode || (req.user.organizations || []).find(o => o.id === req.params.organizationId)
}

// Get the list of organizations
router.get('', asyncWrap(async (req, res, next) => {
  if (config.listEntitiesMode === 'authenticated' && !req.user) return res.send({ results: [], count: 0 })
  if (config.listEntitiesMode === 'admin' && !(req.user && req.user.adminMode)) return res.send({ results: [], count: 0 })

  const params = { ...findUtils.pagination(req.query), sort: findUtils.sort(req.query.sort) }

  // Only service admins can request to see all field. Other users only see id/name
  const allFields = req.query.allFields === 'true'
  if (allFields) {
    if (!req.user || !req.user.adminMode) return res.status(403).send(req.messages.errors.permissionDenied)
  } else {
    params.select = ['id', 'name']
  }

  if (req.query.ids) params.ids = req.query.ids.split(',')
  if (req.query.q) params.q = req.query.q
  if (req.query.creator) params.creator = req.query.creator

  const organizations = await req.app.get('storage').findOrganizations(params)
  if (allFields) {
    organizations.results.forEach(orga => {
      orga.roles = orga.roles || config.roles.defaults
    })
  }
  res.json(organizations)
}))

// Get details of an organization
router.get('/:organizationId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only allowed for the organizations that the user belongs to
  if (!isMember(req)) {
    return res.status(403).send(req.messages.errors.permissionDenied)
  }
  const orga = await req.app.get('storage').getOrganization(req.params.organizationId)
  if (!orga) return res.status(404).send()
  orga.roles = orga.roles || config.roles.defaults
  orga.avatarUrl = req.publicBaseUrl + '/api/avatars/organization/' + orga.id + '/avatar.png'
  if (!req.user.adminMode && orga.orgStorage) delete orga.orgStorage.config
  res.send(orga)
}))

// Get the list of organization roles
// TODO: keep temporarily for compatibility.. but later a simpler GET on the orga will be enough
router.get('/:organizationId/roles', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only search through the organizations that the user belongs to
  if (!isMember(req)) {
    return res.status(403).send(req.messages.errors.permissionDenied)
  }
  const orga = await req.app.get('storage').getOrganization(req.params.organizationId)
  if (!orga) return res.status(404).send()
  res.send(orga.roles || config.roles.defaults)
}))

// Create an organization
router.post('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  const storage = req.app.get('storage')
  if (!req.user.adminMode) {
    const createdOrgs = (await storage.findOrganizations({ size: 0, skip: 0, creator: req.user.id })).count
    let maxCreatedOrgs = (await storage.getUser({ id: req.user.id })).maxCreatedOrgs
    if (maxCreatedOrgs === undefined || maxCreatedOrgs === null) maxCreatedOrgs = config.quotas.defaultMaxCreatedOrgs
    if (maxCreatedOrgs !== -1 && createdOrgs >= maxCreatedOrgs) return res.status(429).send(req.messages.errors.maxCreatedOrgs)
  }
  const orga = req.body
  orga.id = orga.id || shortid.generate()
  await storage.createOrganization(orga, req.user)
  if (!req.user.adminMode || req.query.autoAdmin !== 'false') await storage.addMember(orga, req.user, 'admin')
  webhooks.postIdentity('organization', orga)
  orga.avatarUrl = req.publicBaseUrl + '/api/avatars/organization/' + orga.id + '/avatar.png'

  // update session info
  await tokens.keepalive(req, res)

  res.status(201).send(orga)
}))

// Update some parts of an organization as admin of it
const patchKeys = ['name', 'description', 'departments', 'departmentLabel', '2FA']
router.patch('/:organizationId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only allowed for the organizations that the user is admin of
  if (!isAdmin(req)) {
    return res.status(403).send(req.messages.errors.permissionDenied)
  }
  const fullPatchKeys = req.user.adminMode ? [...patchKeys, 'orgStorage'] : patchKeys
  const forbiddenKey = Object.keys(req.body).find(key => !fullPatchKeys.includes(key))
  if (forbiddenKey) return res.status(400).send('Only some parts of the organization can be modified through this route')
  if (req.body.orgStorage?.config?.searchUserPassword && typeof req.body.orgStorage.config.searchUserPassword === 'string') {
    req.body.orgStorage.config.searchUserPassword = passwordsUtils.cipherPassword(req.body.orgStorage.config.searchUserPassword)
  }
  const patchedOrga = await req.app.get('storage').patchOrganization(req.params.organizationId, req.body, req.user)
  if (req.app.get('storage').db) await req.app.get('storage').db.collection('limits').updateOne({ type: 'organization', id: patchedOrga.id }, { $set: { name: patchedOrga.name } })
  webhooks.postIdentity('organization', patchedOrga)
  patchedOrga.avatarUrl = req.publicBaseUrl + '/api/avatars/organization/' + patchedOrga.id + '/avatar.png'

  // update session info
  await tokens.keepalive(req, res)

  res.send(patchedOrga)
}))

// Get the members of an organization. i.e. a partial user object (id, name, role).
router.get('/:organizationId/members', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only search through the organizations that the user belongs to
  if (!isMember(req)) {
    return res.status(403).send(req.messages.errors.permissionDenied)
  }
  const org = await req.app.get('storage').getOrganization(req.params.organizationId)
  if (!org) return res.status(404).send('organization not found')

  const storages = [req.app.get('storage')]
  if (org.orgStorage && org.orgStorage.active && config.perOrgStorageTypes.includes(org.orgStorage.type)) {
    // org_storage can be yes, no or both (both is default)
    if (req.query.org_storage === 'false') {
      // nothing todo
    } else {
      const secondaryStorage = await storageFactory.init(org.orgStorage.type, { ...defaultConfig.storage[org.orgStorage.type], ...org.orgStorage.config }, org)
      secondaryStorage.orgStorage = true
      if (req.query.org_storage === 'true') {
        storages[0] = secondaryStorage
      } else {
        storages.push(secondaryStorage)
      }
    }
  }

  const params = { ...findUtils.pagination(req.query), sort: findUtils.sort(req.query.sort) }
  if (req.query.q) params.q = req.query.q
  if (req.query.ids || req.query.id) params.ids = (req.query.ids || req.query.id).split(',')
  if (req.query.role) params.roles = req.query.role.split(',')
  if (req.query.department) params.departments = req.query.department.split(',')
  const members = { count: 0, results: [] }
  for (const storage of storages) {
    // do our best to mix results in "org_storage=both" mode
    if (members.count < (params.skip + params.size)) {
      params.skip -= members.count
      if (params.skip < 0) {
        params.size += params.skip
        params.skip = 0
      }
      const storageMembers = await storage.findMembers(req.params.organizationId, params)
      if (storageMembers && storageMembers.count) {
        members.count += storageMembers.count
        members.results = members.results.concat(storageMembers.results.map(r => ({ ...r, orgStorage: storage.orgStorage })))
      }
    }
  }
  res.send(members)
}))

// Exclude a member of the organization
router.delete('/:organizationId/members/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only allowed for the organizations that the user is admin of
  if (!isAdmin(req)) {
    return res.status(403).send(req.messages.errors.permissionDenied)
  }
  const storage = req.app.get('storage')
  await storage.removeMember(req.params.organizationId, req.params.userId)
  if (storage.db) {
    await limits.setNbMembers(storage.db, req.params.organizationId)
  }

  // update session info
  await tokens.keepalive(req, res)

  res.status(204).send()
}))

// Change the role of the user in the organization
router.patch('/:organizationId/members/:userId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  // Only allowed for the organizations that the user is admin of
  if (!isAdmin(req)) {
    return res.status(403).send(req.messages.errors.permissionDenied)
  }
  const orga = await req.app.get('storage').getOrganization(req.params.organizationId)
  if (!orga) return res.status(404).send()
  const roles = orga.roles || config.roles.defaults
  if (!roles.includes(req.body.role)) return res.status(400).send(req.messages.errors.replace('{role}', req.body.role))
  await req.app.get('storage').setMemberRole(req.params.organizationId, req.params.userId, req.body.role, req.body.department)

  // update session info
  await tokens.keepalive(req, res)

  res.status(204).send()
}))

// Super admin and orga admin can delete an organization for now
router.delete('/:organizationId', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!isAdmin(req)) return res.status(403).send(req.messages.errors.permissionDenied)
  const { count } = await req.app.get('storage').findMembers(req.params.organizationId, { size: 0, skip: 0 })
  if (count > 1) return res.status(400).send(req.messages.errors.nonEmptyOrganization)
  await req.app.get('storage').deleteOrganization(req.params.organizationId)
  webhooks.deleteIdentity('organization', req.params.organizationId)

  // update session info
  await tokens.keepalive(req, res)

  res.status(204).send()
}))
