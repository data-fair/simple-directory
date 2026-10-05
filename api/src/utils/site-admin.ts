import type { Request } from 'express'
import type { Site, User } from '#types'
import { reqSession } from '@data-fair/lib-express'
import config from '#config'
import { reqSite } from '#services'

// A site admin is a root admin of the organization that owns the site the request is made on
// (siteRole is derived from the token's siteOwner, set when logging in on that site).
// Department admins are excluded even though their siteRole is also 'admin'.
// Returns the current site so that callers can confine the privilege to resources bound to it.
export async function reqSiteAdminSite (req: Request): Promise<Site | undefined> {
  if (!config.siteAdmin) return
  const session = reqSession(req)
  if (session.siteRole !== 'admin' || !session.user || !session.organization) return
  if (session.organization.department) return
  const site = await reqSite(req)
  // the token carries no host: without this check a site admin could replay their session
  // through another site's host and administer that site's accounts
  if (!site || site.owner.type !== 'organization' || site.owner.id !== session.organization.id) return
  return site
}

// true if the request comes from a site admin and the resource (user or organization) is bound
// to the current site. Resources of the main back-office (no host) are never matched, this is
// what keeps superadmins and other sites' accounts out of reach.
export async function isSiteAdminOf (req: Request, resource: { host?: string, path?: string } | null | undefined) {
  if (!resource?.host) return false
  const site = await reqSiteAdminSite(req)
  if (!site) return false
  return site.host === resource.host && (site.path ?? '') === (resource.path ?? '')
}

// Site admins can act on the accounts of their site, never on their own account (these actions
// go through the self-service routes) and never on non-human identities (managed by org admins).
export async function isSiteAdminOfUser (req: Request, user: User | null | undefined) {
  if (!user || user.nhi) return false
  if (user.id === reqSession(req).user?.id) return false
  return isSiteAdminOf(req, user)
}
