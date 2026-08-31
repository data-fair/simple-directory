import { Router } from 'express'
import { httpError, reqSessionAuthenticated, type EventLogContext } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import config from '#config'
import storages from '#storages'
import { reqI18n } from '#i18n'
import { postUserIdentityWebhook, deleteIdentityWebhook } from '#services'
import { isOrgAdmin } from '../organizations/service.ts'
import { checkProvider } from './keys.ts'
import { createNhi, getNhi, listNhis } from './service.ts'
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

const getOrgAndRoles = async (organizationId: string) => {
  const org = await storages.globalStorage.getOrganization(organizationId)
  if (!org) throw httpError(404, 'organization not found')
  const roles = org.roles?.length ? org.roles : config.roles.defaults
  return { org, roles }
}

router.get('', async (req: Request<OrgParams>, res) => {
  await assertOrgAdmin(req)
  res.send(await listNhis(req.params.organizationId))
})

router.post('', async (req: Request<OrgParams>, res) => {
  await assertOrgAdmin(req)
  const { body } = (await import('#doc/nhis/post-req/index.ts')).returnValid(req, { name: 'req' })
  const logContext: EventLogContext = { req }
  const { org, roles } = await getOrgAndRoles(req.params.organizationId)
  if (!roles.includes(body.role)) throw httpError(400, 'unknown role')
  await checkProvider(body.provider)
  const sessionUser = reqSessionAuthenticated(req).user
  const user = await createNhi(org, body, { id: sessionUser.id, name: sessionUser.name })
  logContext.account = { type: 'organization', id: org.id, name: org.name }
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
  if (body.subject || body.provider) {
    patch.nhi = {
      provider: body.provider ?? user.nhi!.provider,
      subject: body.subject ?? user.nhi!.subject
    }
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
  eventsLog.info('sd.nhi.delete', `an NHI was deleted ${user.id}`, logContext)
  deleteIdentityWebhook('user', user.id)
  res.status(204).send()
})
