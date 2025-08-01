import type { Member, Organization } from '#types'
import { Router, type Request } from 'express'
import { reqUser, getAccountRole, reqSession, reqSiteUrl, httpError, session, mongoPagination, mongoSort, type EventLogContext } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import eventsQueue from '#events-queue'
import { nanoid } from 'nanoid'
import config from '#config'
import { reqI18n } from '#i18n'
import storages from '#storages'
import mongo from '#mongo'
import type { FindMembersParams, FindOrganizationsParams, SdStorage } from '../storages/interface.ts'
import { setNbMembersLimit, sendMailI18n, postOrganizationIdentityWebhook, postUserIdentityWebhook, deleteIdentityWebhook, keepalive, signToken, shortenPartnerInvitation, unshortenPartnerInvitation, reqSite } from '#services'
import { __all } from '#i18n'
import { stringify as csvStringify } from 'csv-stringify/sync'
import _slug from 'slugify'
import { cipher } from '../utils/cipher.ts'
import Debug from 'debug'

const slug = _slug.default

const router = Router()
export default router
/*
function getUserOrg (req, noDep = true) {
  return (reqUser(req).organizations || []).find(o => o.id === req.params.organizationId && !(noDep && o.department))
}
function getUserOrgDep (req) {
  return (reqUser(req).organizations || []).find(o => o.id === req.params.organizationId && req.query.department && o.department === req.query.department)
}

*/

// Either a super admin, or an admin of the current organization
async function isOrgAdmin (req: Request) {
  const role = getAccountRole(reqSession(req), { type: 'organization', id: req.params.organizationId }, { acceptDepAsRoot: config.depAdminIsOrgAdmin })
  if (role === 'admin') return true
  if (config.siteAdmin && reqSession(req).siteRole === 'admin') {
    const site = await reqSite(req)
    const orga = await storages.globalStorage.getOrganization(req.params.organizationId)
    if (site && orga?.host === site.host && orga?.path === site.path) {
      return true
    }
  }
  return false
}

// Either a super admin, or a member of the current organization
async function isMember (req: Request, allAccounts?: boolean) {
  if (getAccountRole(reqSession(req), { type: 'organization', id: req.params.organizationId }, { acceptDepAsRoot: true, allAccounts })) {
    return true
  }
  if (config.siteAdmin && reqSession(req).siteRole === 'admin') {
    const site = await reqSite(req)
    const orga = await storages.globalStorage.getOrganization(req.params.organizationId)
    if (site && orga?.host === site.host && orga?.path === site.path) {
      return true
    }
  }
}

// Get the list of organizations
router.get('', async (req, res, next) => {
  const session = reqSession(req)
  const user = session.user

  const listMode = config.listOrganizationsMode || config.listEntitiesMode
  if (listMode === 'authenticated' && !user) return res.send({ results: [], count: 0 })
  if (listMode === 'admin' && !(user?.adminMode)) return res.send({ results: [], count: 0 })

  const params: FindOrganizationsParams = { ...mongoPagination(req.query), sort: mongoSort(req.query.sort) }

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
  if (typeof req.query.creator === 'string') params.creator = req.query.creator

  const organizations = await storages.globalStorage.findOrganizations(params)
  if (allFields) {
    organizations.results.forEach(orga => {
      orga.roles = orga.roles || config.roles.defaults
      if (config.manageDepartmentLabel && config.defaultDepartmentLabel && !orga.departmentLabel) orga.departmentLabel = config.defaultDepartmentLabel
      if (config.manageRolesLabels) orga.rolesLabels = { ...config.defaultRolesLabels, ...orga.rolesLabels }
    })
  }
  res.json(organizations)
})

// Get details of an organization
router.get('/:organizationId', async (req, res, next) => {
  if (!reqUser(req)) return res.status(401).send()
  // Only allowed for the organizations that the user belongs to
  if (!await isMember(req, true)) {
    throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  }
  const orga = await storages.globalStorage.getOrganization(req.params.organizationId)
  if (!orga) return res.status(404).send()
  orga.roles = orga.roles || config.roles.defaults
  if (config.manageDepartmentLabel && config.defaultDepartmentLabel && !orga.departmentLabel) orga.departmentLabel = config.defaultDepartmentLabel
  if (config.manageRolesLabels) orga.rolesLabels = { ...config.defaultRolesLabels, ...orga.rolesLabels }

  if (!reqUser(req)?.adminMode && orga.orgStorage) delete orga.orgStorage.config
  res.send(orga)
})

// Get the list of organization roles
// TODO: keep temporarily for compatibility.. but later a simpler GET on the orga will be enough
router.get('/:organizationId/roles', async (req, res, next) => {
  if (!reqUser(req)) return res.status(401).send()
  // Only search through the organizations that the user belongs to
  if (!await isMember(req)) {
    throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  }
  const orga = await storages.globalStorage.getOrganization(req.params.organizationId)
  if (!orga) return res.status(404).send()
  res.send(orga.roles || config.roles.defaults)
})

// Create an organization
router.post('', async (req, res, next) => {
  const user = reqUser(req)
  const logContext: EventLogContext = { req }

  if (!user) return res.status(401).send()
  const storage = storages.globalStorage
  if (!user.adminMode) {
    const createdOrgs = (await storage.findOrganizations({ size: 0, skip: 0, creator: user.id })).count
    let maxCreatedOrgs = (await storage.getUser(user.id))?.maxCreatedOrgs
    if (maxCreatedOrgs === undefined || maxCreatedOrgs === null) maxCreatedOrgs = config.quotas.defaultMaxCreatedOrgs
    if (maxCreatedOrgs !== -1 && createdOrgs >= maxCreatedOrgs) return res.status(429).send(reqI18n(req).messages.errors.maxCreatedOrgs)
  }
  const { body } = (await import('#doc/organizations/post-req/index.ts')).returnValid(req, { name: 'req' })
  const orga = body as Organization

  const site = await reqSite(req)
  if (config.siteOrgs && site) {
    orga.host = site.host
    if (site.path) orga.path = site.path
  }

  const createdOrga = await storage.createOrganization(orga, user)
  logContext.account = { type: 'organization', id: createdOrga.id, name: createdOrga.name }
  eventsLog.info('sd.org.create', `a user created an organization: ${orga.name} (${orga.id})`, logContext)
  let autoAdmin = !reqUser(req)?.adminMode
  if (typeof req.query.autoAdmin === 'string') autoAdmin = req.query.autoAdmin === 'true'
  if (autoAdmin) await storage.addMember(createdOrga, user, 'admin')
  postOrganizationIdentityWebhook(createdOrga)

  // update session info
  await keepalive(req, res)

  res.status(201).send(createdOrga)
})

// Update some parts of an organization as admin of it
router.patch('/:organizationId', async (req, res, next) => {
  const user = reqUser(req)
  const logContext: EventLogContext = { req }

  if (!user) return res.status(401).send()
  // Only allowed for the organizations that the user is admin of
  if (!await isOrgAdmin(req)) {
    throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  }

  const { body: patch } = (await import('#doc/organizations/patch-req/index.ts')).returnValid(req, { name: 'req' })
  if (patch.orgStorage && !user.adminMode) throw httpError(403)
  if (patch.orgStorage?.config?.searchUserPassword && typeof patch.orgStorage.config.searchUserPassword === 'string') {
    patch.orgStorage.config.searchUserPassword = cipher(patch.orgStorage.config.searchUserPassword)
  }
  if (patch.departments) {
    for (const dep of patch.departments) {
      if (!dep.id) {
        if (patch.departments.find(d => d.id && d.name === dep.name)) {
          return res.status(400).send(reqI18n(req).messages.errors.duplicateDep)
        }
        const baseId = slug(dep.name, { lower: true, strict: true })
        let id = baseId
        let i = 1
        while (patch.departments.find(d => d.id === id)) {
          i += 1
          id = baseId + '-' + i
        }
        dep.id = id
      }
    }
  }
  const patchedOrga = await storages.globalStorage.patchOrganization(req.params.organizationId, patch, user)

  logContext.account = { type: 'organization', id: patchedOrga.id, name: patchedOrga.name }
  eventsLog.info('sd.org.patch', `a user patched the organization info ${Object.keys(patch).join(', ')} - ${patchedOrga.name} ${patchedOrga.id}`, logContext)

  await mongo.limits.updateOne({ type: 'organization', id: patchedOrga.id }, { $set: { name: patchedOrga.name } })
  postOrganizationIdentityWebhook(patchedOrga)

  // update session info
  await keepalive(req, res)

  res.send(patchedOrga)
})

// Get the members of an organization. i.e. a partial user object (id, name, role).
router.get('/:organizationId/members', async (req, res, next) => {
  const logContext: EventLogContext = { req }

  if (!reqUser(req)) return res.status(401).send()
  // Only search through the organizations that the user belongs to
  if (!await isMember(req)) {
    throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  }

  const org = await storages.globalStorage.getOrganization(req.params.organizationId)
  if (!org) return res.status(404).send('organization not found')
  logContext.account = { type: 'organization', id: org.id, name: org.name }

  const orgStorages: (SdStorage & { orgStorage?: boolean })[] = [storages.globalStorage]

  // org_storage can be yes, no or both (both is default)
  if (req.query.org_storage === 'false') {
    // nothing todo
  } else {
    const secondaryStorage: undefined | (SdStorage & { orgStorage?: boolean }) = await storages.createOrgStorage(org)
    if (secondaryStorage) {
      secondaryStorage.orgStorage = true
      if (req.query.org_storage === 'true') {
        orgStorages[0] = secondaryStorage
      } else {
        orgStorages.push(secondaryStorage)
      }
    }
  }

  const pagination = mongoPagination(req.query)
  const params: FindMembersParams = { ...pagination, sort: mongoSort(req.query.sort) }
  if (typeof req.query.q === 'string') params.q = req.query.q
  if (typeof req.query.ids === 'string') params.ids = req.query.ids.split(',')
  else if (typeof req.query.id === 'string') params.ids = req.query.id.split(',')
  if (typeof req.query.role === 'string') params.roles = req.query.role.split(',')
  if (typeof req.query.department === 'string') params.departments = req.query.department.split(',')
  if (typeof req.query.email === 'string') params.emails = req.query.email.split(',')
  if (typeof req.query.email_confirmed === 'string') params.emailConfirmed = req.query.email_confirmed === 'true'
  const members: { count: number, results: Member[], fromCache?: string } = { count: 0, results: [] }
  for (const storage of orgStorages) {
    // do our best to mix results in "org_storage=both" mode
    if (members.count <= (pagination.skip + pagination.size)) {
      pagination.skip -= members.count
      if (pagination.skip < 0) {
        pagination.size += pagination.skip
        params.skip = 0
      }
      const storageMembers = await storage.findMembers(req.params.organizationId, params)
      if (storageMembers && storageMembers.count) {
        members.count += storageMembers.count
        members.results = members.results.concat(storageMembers.results.map(r => ({ ...r, orgStorage: storage.orgStorage })))
        members.fromCache = storageMembers.fromCache
      }
    }
  }

  eventsLog.info('sd.org.get-member', `a user read the list of members of an organization ${org.name}(${org.id})`, logContext)

  if (req.query.format === 'csv') {
    res.setHeader('content-disposition', 'attachment; filename="members.csv"')
    const csv = csvStringify(members.results, {
      header: true,
      columns: ['name', 'email', 'role', 'department', 'departmentName'],
      // for better excel support
      bom: true,
      delimiter: ';'
    })
    res.send(csv)
  } else {
    res.send(members)
  }
})

// Exclude a member of the organization
router.delete('/:organizationId/members/:userId', async (req, res, next) => {
  const logContext: EventLogContext = { req }

  if (!reqUser(req)) return res.status(401).send()
  const storage = storages.globalStorage

  const dep = (req.query.department && typeof req.query.department === 'string') ? req.query.department : undefined
  const filter: FindMembersParams = { ids: [req.params.userId], skip: 0, size: 1 }
  if (dep) filter.departments = [dep]
  const role = typeof req.query.role === 'string' ? req.query.role : undefined
  if (role) filter.roles = [role]
  const member = (await storage.findMembers(req.params.organizationId, filter)).results[0]
  if (!member) return res.status(404).send('member not found')

  // Only allowed for the organizations that the user is admin of

  // Only allowed for the organizations that the user is admin of (or admin of the member's department)
  const userRole = getAccountRole(
    reqSession(req),
    { type: 'organization', id: req.params.organizationId, department: dep },
    { acceptDepAsRoot: config.depAdminIsOrgAdmin }
  )
  if (userRole !== 'admin') throw httpError(403, reqI18n(req).messages.errors.permissionDenied)

  eventsLog.info('sd.org.member.del', `a user removed a member from an organization ${member.name} (${member.id}), ${req.params.organizationId}`, logContext)
  await storage.removeMember(req.params.organizationId, req.params.userId, dep, role)
  await setNbMembersLimit(req.params.organizationId)

  const user = await storage.getUser(req.params.userId)
  if (!user) return res.status(404).send('user not found')
  if (config.onlyCreateInvited && !user.organizations.length) {
    eventsLog.info('sd.org.member.del-user', `a user was removed after being excluded from last organization ${user.name} (${user.id})`, logContext)
    await storage.deleteUser(req.params.userId)
    deleteIdentityWebhook('user', user.id)
  } else {
    postUserIdentityWebhook(user)
  }

  // update session info
  await keepalive(req, res)

  res.status(204).send()
})

// Change the role of the user in the organization
router.patch('/:organizationId/members/:userId', async (req, res, next) => {
  const logContext: EventLogContext = { req }

  if (!reqUser(req)) return res.status(401).send()

  const { query, body } = (await import('#doc/organizations/patch-member-req/index.ts')).returnValid(req, { name: 'req' })
  const storage = storages.globalStorage
  const dep = query.department
  const filter: FindMembersParams = { ids: [req.params.userId], skip: 0, size: 1 }
  if (typeof dep === 'string') filter.departments = [dep]
  const member = (await storage.findMembers(req.params.organizationId, filter)).results[0]

  // Only allowed for the organizations that the user is admin of (or admin of the member's department)
  const role = getAccountRole(
    reqSession(req),
    { type: 'organization', id: req.params.organizationId, department: query.department },
    { acceptDepAsRoot: config.depAdminIsOrgAdmin }
  )
  if (role !== 'admin') throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  const orga = await storage.getOrganization(req.params.organizationId)
  if (!orga) return res.status(404).send()
  logContext.account = { type: 'organization', id: orga.id, name: orga.name }
  const roles = orga.roles || config.roles.defaults
  if (!roles.includes(body.role)) throw httpError(400, reqI18n(req).messages.errors.unknownRole.replace('{role}', body.role))
  if (config.multiRoles && !query.role) throw httpError(400, 'query.role is required in multi-roles mode')
  await storage.patchMember(req.params.organizationId, req.params.userId, query.department, query.role, body)
  eventsLog.info('sd.org.member.patch', `a user changed the role of a member in an organization ${member.name} (${member.id}) ${body.role} ${body.department ?? ''}`, logContext)
  postUserIdentityWebhook(await storage.getUser(req.params.userId))

  // update session info
  await keepalive(req, res)

  res.status(204).send()
})

// Super admin and orga admin can delete an organization for now
router.delete('/:organizationId', async (req, res, next) => {
  /** @type {import('@data-fair/lib-express/events-log.js').EventLogContext} */
  const logContext = { req }

  if (!reqUser(req)) return res.status(401).send()
  if (!await isOrgAdmin(req)) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
  const { count } = await storages.globalStorage.findMembers(req.params.organizationId, { size: 0, skip: 0 })
  if (count > 1) return res.status(400).send(reqI18n(req).messages.errors.nonEmptyOrganization)
  await storages.globalStorage.deleteOrganization(req.params.organizationId)
  eventsLog.info('sd.org.delete', `a user deleted an organization ${req.params.organizationId}`, logContext)
  deleteIdentityWebhook('organization', req.params.organizationId)

  // update session info
  await keepalive(req, res)

  res.status(204).send()
})

if (config.managePartners) {
  // Invitation for an organization to join us as partners
  const debugPartners = Debug('partners')
  router.post('/:organizationId/partners', async (req, res, next) => {
    const logContext: EventLogContext = { req }

    if (!reqUser(req)) return res.status(401).send()
    if (!await isOrgAdmin(req)) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)

    const { body: partnerPost } = (await import('#doc/organizations/post-partner-req/index.ts')).returnValid(req)

    const storage = storages.globalStorage

    const orga = await storage.getOrganization(req.params.organizationId)
    if (!orga) return res.status(404).send()
    logContext.account = { type: 'organization', id: orga.id, name: orga.name }

    const partnerId = nanoid()

    const token = await signToken(shortenPartnerInvitation(partnerPost, orga, partnerId), config.jwtDurations.partnerInvitationToken)

    await storage.addPartner(orga.id, { name: partnerPost.name, contactEmail: partnerPost.contactEmail, partnerId, createdAt: new Date().toISOString() })
    eventsLog.info('sd.org.partner.invite', `a user invited an organization to be a partner ${partnerPost.name} ${partnerPost.contactEmail} ${orga.name} ${orga.id}`, logContext)

    const linkUrl = new URL(reqSiteUrl(req) + '/simple-directory/login')
    linkUrl.searchParams.set('step', 'partnerInvitation')
    linkUrl.searchParams.set('partner_invit_token', token)
    linkUrl.searchParams.set('redirect', partnerPost.redirect || reqSiteUrl(req) + '/simple-directory')
    const params = {
      link: linkUrl.href,
      organization: orga.name,
      partner: partnerPost.name
    }
    await sendMailI18n('partnerInvitation', reqI18n(req).messages, partnerPost.contactEmail, params)

    eventsQueue?.pushEvent({
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin' },
      topic: { key: 'simple-directory:partner-invitation-sent' },
      title: __all('notifications.sentPartnerInvitation', { partnerName: partnerPost.name, email: partnerPost.contactEmail, orgName: orga.name })
    })

    res.status(201).send()
  })

  router.post('/:organizationId/partners/_accept', async (req, res, next) => {
    const logContext: EventLogContext = { req }
    const user = reqUser(req)

    if (!user) return res.status(401).send()
    const { body: partnerAccept } = (await import('#doc/organizations/post-partner-accept-req/index.ts')).returnValid(req)

    // user must be owner of the new partner
    const userOrga = user.organizations.find(o => o.id === partnerAccept.id && !o.department)
    if (!userOrga || userOrga.role !== 'admin') throw httpError(403)
    logContext.account = { type: 'organization', id: userOrga.id, name: userOrga.name }

    const storage = storages.globalStorage
    const partnerOrga = await storage.getOrganization(partnerAccept.id)
    if (!partnerOrga) return res.status(404).send('unknown organization')

    let tokenPayload
    try {
      tokenPayload = unshortenPartnerInvitation(await session.verifyToken(partnerAccept.token))
    } catch (err: any) {
      return res.status(400).send(err.message)
    }

    // user must have access to a token sent to the contact email
    if (tokenPayload.contactEmail !== partnerAccept.contactEmail || tokenPayload.orgId !== req.params.organizationId) {
      return res.status(400).send('requête incohérente avec l\'invitation envoyée')
    }
    const orga = await storage.getOrganization(req.params.organizationId)
    if (!orga) return res.status(404).send('unknown organization')
    debugPartners('accept partner invitation', tokenPayload, partnerOrga.name, partnerOrga.id)

    const conflictInvitation = (orga.partners || []).find(p => p.id === partnerOrga.id)
    if (conflictInvitation) return res.status(400).send('cette organisation est déjà partenaire')

    const pendingInvitation = (orga.partners || []).find(p => p.partnerId === tokenPayload.partnerId && p.contactEmail === partnerAccept.contactEmail && !p.id)
    if (!pendingInvitation) return res.status(400).send('pas d\'invitation en attente de validation')

    await storage.validatePartner(orga.id, tokenPayload.partnerId, partnerOrga)

    eventsLog.info('sd.org.partner.accept', `a user accepted an organization to be a partner ${partnerOrga.name} (${partnerOrga.id}) of ${orga.name} (${orga.id})`, logContext)

    const notif = {
      sender: { type: 'organization', id: orga.id, name: orga.name, role: 'admin' },
      topic: { key: 'simple-directory:partner-invitation-accepted' },
      title: __all('notifications.acceptedPartnerInvitation', { email: partnerAccept.contactEmail, partnerName: partnerOrga.name, orgName: orga.name })
    }
    // send notif to all admins subscribed to the topic
    debugPartners(notif)

    res.status(201).send()
  })

  router.delete('/:organizationId/partners/:partnerId', async (req, res, next) => {
    const logContext: EventLogContext = { req }

    if (!reqUser(req)) return res.status(401).send()
    if (!await isOrgAdmin(req)) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
    const storage = storages.globalStorage
    await storage.deletePartner(req.params.organizationId, req.params.partnerId)

    eventsLog.info('sd.org.partner.delete', `a user removed a partner from an organization ${req.params.partnerId} ${req.params.organizationId}`, logContext)
    res.status(201).send()
  })

  router.get('/:organizationId/partners/_user-partners', async (req, res, next) => {
    const user = reqUser(req)
    if (!user) return res.status(401).send()
    const storage = storages.globalStorage
    const orga = await storage.getOrganization(req.params.organizationId)
    if (!orga) return res.status(404).send('unknown organization')
    const userPartners = []
    for (const partner of (orga.partners || [])) {
      const userOrg = user.organizations?.find(o => o.id === partner.id)
      if (!userOrg) continue
      userPartners.push(userOrg)
    }
    res.send(userPartners)
  })
}
