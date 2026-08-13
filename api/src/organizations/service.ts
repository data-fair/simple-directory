import type { Request } from 'express'
import { getAccountRole, reqSession } from '@data-fair/lib-express'
import config from '#config'
import storages from '#storages'
import { reqSite } from '#services'

// Either a super admin, or an admin of the current organization (or the org admin
// of the site the organization is bound to, when siteAdmin is enabled). Shared by
// organizations/router.ts and nhis/router.ts so that anyone who can administer an
// organization can also administer its non-human identities.
export async function isOrgAdmin (req: Request) {
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
