import { Router } from 'express'
import { httpError, reqSessionAuthenticated, type EventLogContext } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import storages from '#storages'
import { reqI18n } from '#i18n'
import { postUserIdentityWebhook, deleteIdentityWebhook, setNbMembersLimit } from '#services'
import { isOrgAdmin } from '../organizations/service.ts'
import { checkProvider } from './keys.ts'
import { checkAllowedIps } from './ips.ts'
import { checkScopes } from './scopes.ts'
import { getKnownScopes } from '../scopes/service.ts'
import { getGrantRecord, listGrantRecords, revokeGrant, revokeGrants } from '../oauth-server/grants.ts'
import { createNhi, getNhi, listNhis, orgRoles, validateNewNhi } from './service.ts'
import type { Request } from 'express'

const router = Router({ mergeParams: true })
export default router

type OrgParams = { organizationId: string }
type NhiParams = { organizationId: string, nhiId: string }

// Parity with organizations/router.ts: anyone who can administer the org (including
// via the siteAdmin fallback) can administer its non-human identities.
const assertOrgAdmin = async (req: Request<OrgParams>) => {
  if (!await isOrgAdmin(req)) throw httpError(403, reqI18n(req).messages.errors.permissionDenied)
}

const knownScopes = (req: Request<any>) => {
  const { localeCode, messages } = reqI18n(req)
  return getKnownScopes(localeCode, messages.scopes)
}

const getOrgAndRoles = async (organizationId: string) => {
  const org = await storages.globalStorage.getOrganization(organizationId)
  if (!org) throw httpError(404, 'organization not found')
  return { org, roles: orgRoles(org) }
}

router.get('', async (req: Request<OrgParams>, res) => {
  await assertOrgAdmin(req)
  res.send(await listNhis(req.params.organizationId))
})

router.post('', async (req: Request<OrgParams>, res) => {
  await assertOrgAdmin(req)
  const { body } = (await import('#doc/nhis/post-req/index.ts')).returnValid(req, { name: 'req' })
  const logContext: EventLogContext = { req }
  const { org } = await getOrgAndRoles(req.params.organizationId)
  await validateNewNhi(req, org, body)
  logContext.account = { type: 'organization', id: org.id, name: org.name }
  const sessionUser = reqSessionAuthenticated(req).user
  const user = await createNhi(org, body, { id: sessionUser.id, name: sessionUser.name })
  await setNbMembersLimit(org.id)
  eventsLog.info('sd.nhi.create', `an NHI was created ${user.id} in org ${org.id}`, logContext)
  postUserIdentityWebhook(user)
  res.status(201).send(user)
})

router.patch('/:nhiId', async (req: Request<NhiParams>, res) => {
  await assertOrgAdmin(req)
  const { body } = (await import('#doc/nhis/patch-req/index.ts')).returnValid(req, { name: 'req' })
  const logContext: EventLogContext = { req }
  const { org, roles } = await getOrgAndRoles(req.params.organizationId)
  const user = await getNhi(org.id, req.params.nhiId)
  logContext.account = { type: 'organization', id: org.id, name: org.name }
  const patch: any = {}
  if (body.name) patch.name = body.name
  if (body.provider) await checkProvider(body.provider)
  if (body.subject || body.provider || body.allowedIps !== undefined || body.ipBinding !== undefined || body.scopes !== undefined) {
    // patchUser $sets the whole nhi sub-object, so carry the untouched fields over
    const nhi = { ...user.nhi! }
    if (body.provider) nhi.provider = body.provider
    if (body.subject) nhi.subject = body.subject
    // an OAuth-bound NHI may be given a key binding, but only whole
    if (!!nhi.provider !== !!nhi.subject) throw httpError(400, 'provider and subject go together')
    if (body.allowedIps !== undefined) {
      if (body.allowedIps === null) delete nhi.allowedIps
      else {
        checkAllowedIps(body.allowedIps)
        nhi.allowedIps = body.allowedIps
      }
    }
    // stored only when true, so an unrestricted NHI has no leftover ipBinding: false
    if (body.ipBinding !== undefined) {
      if (body.ipBinding) nhi.ipBinding = true
      else delete nhi.ipBinding
    }
    if (body.scopes !== undefined) {
      if (body.scopes === null) delete nhi.scopes
      else {
        checkScopes(body.scopes, await knownScopes(req), user.nhi?.scopes ?? [])
        nhi.scopes = body.scopes
      }
    }
    patch.nhi = nhi
  }
  if (body.role || body.department !== undefined) {
    const membership = { ...user.organizations[0] }
    if (body.role) {
      if (!roles.includes(body.role)) throw httpError(400, 'unknown role')
      membership.role = body.role
    }
    if (body.department !== undefined) {
      if (body.department === '') {
        delete membership.department
        delete membership.departmentName
      } else {
        const dep = org.departments?.find(d => d.id === body.department)
        if (!dep) throw httpError(400, 'unknown department')
        membership.department = dep.id
        membership.departmentName = dep.name
      }
    }
    patch.organizations = [membership]
  }
  const patched = await storages.globalStorage.patchUser(user.id, patch, reqSessionAuthenticated(req).user)
  eventsLog.info('sd.nhi.patch', `an NHI was patched ${user.id}`, logContext)
  postUserIdentityWebhook(patched)
  res.send(patched)
})

router.delete('/:nhiId', async (req: Request<NhiParams>, res) => {
  await assertOrgAdmin(req)
  const logContext: EventLogContext = { req }
  const user = await getNhi(req.params.organizationId, req.params.nhiId)
  logContext.account = { type: 'organization', id: req.params.organizationId, name: user.organizations[0]?.name }
  await storages.globalStorage.deleteUser(user.id)
  await setNbMembersLimit(req.params.organizationId)
  eventsLog.info('sd.nhi.delete', `an NHI was deleted ${user.id}`, logContext)
  deleteIdentityWebhook('user', user.id)
  res.status(204).send()
})

// OAuth connections of an NHI: the grants dynamic clients (MCP agents) hold on its behalf
router.get('/:nhiId/oauth-grants', async (req: Request<NhiParams>, res) => {
  await assertOrgAdmin(req)
  const nhi = await getNhi(req.params.organizationId, req.params.nhiId)
  const records = await listGrantRecords({ subjectId: nhi.id })
  res.json({
    results: records.filter(r => r.subject.type === 'nhi').map(r => ({
      id: r._id,
      clientId: r.clientId,
      clientName: r.clientName,
      clientKind: r.clientKind,
      scope: r.scope,
      resources: r.resources,
      authorizedBy: r.authorizedBy,
      createdAt: r.createdAt,
      expiresAt: r.expiresAt,
      lastUsedAt: r.lastUsedAt
    }))
  })
})

router.delete('/:nhiId/oauth-grants', async (req: Request<NhiParams>, res) => {
  await assertOrgAdmin(req)
  const nhi = await getNhi(req.params.organizationId, req.params.nhiId)
  // both filters: never revoke the client's grants of other subjects
  const clientId = req.query.clientId
  if (typeof clientId !== 'string' || !clientId) throw httpError(400, 'clientId is required')
  const logContext: EventLogContext = { req }
  logContext.account = { type: 'organization', id: req.params.organizationId, name: nhi.organizations[0]?.name }
  await revokeGrants({ subjectId: nhi.id, clientId }, 'org-admin', logContext)
  res.status(204).send()
})

router.delete('/:nhiId/oauth-grants/:grantId', async (req: Request<NhiParams & { grantId: string }>, res) => {
  await assertOrgAdmin(req)
  const nhi = await getNhi(req.params.organizationId, req.params.nhiId)
  const record = await getGrantRecord(req.params.grantId)
  if (!record || record.subject.type !== 'nhi' || record.subject.id !== nhi.id) throw httpError(404, 'grant not found')
  const logContext: EventLogContext = { req }
  logContext.account = { type: 'organization', id: req.params.organizationId, name: nhi.organizations[0]?.name }
  await revokeGrant(record._id, 'org-admin', logContext)
  res.status(204).send()
})
