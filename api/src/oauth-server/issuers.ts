import config from '#config'
import mongo from '#mongo'
import type { Site, User } from '#types'
import { getSiteByUrl, resolveAccountMainSite } from '../sites/service.ts'

export type IssuerContext = { issuer: string, site: Site | undefined, siteUrl: string }
export type ResolvedResource = { kind: 'api' | 'mcp', site: Site | undefined, siteUrl: string, audience: string | string[] }

// thrown for any unknown or out-of-realm resource, callers map it to invalid_target
export class ResourceError extends Error {}

const stripSlash = (s: string) => s.replace(/\/+$/, '')

// config.publicUrl may include the /simple-directory path (dev/test), the site url never does
export const mainSiteUrl = () => stripSlash(stripSlash(config.publicUrl).replace(/\/simple-directory$/, ''))

export const issuerOfSite = async (site: Site | undefined, siteUrl: string): Promise<IssuerContext | null> => {
  siteUrl = stripSlash(siteUrl)
  if (!site) return { issuer: stripSlash(config.publicUrl), site, siteUrl }
  let isIssuer = !!site.isAccountMain
  if (!isIssuer && site.authMode === 'onlyLocal') {
    // a standalone site only: an owner with a designated main site delegates to it
    const accountMain = await mongo.sites.findOne({ 'owner.type': site.owner.type, 'owner.id': site.owner.id, isAccountMain: true })
    isIssuer = !accountMain
  }
  if (!isIssuer) return null
  return { issuer: siteUrl + '/simple-directory', site, siteUrl }
}

// undefined = main site, null = unknown
const findSite = async (url: string): Promise<Site | undefined | null> => {
  if (url === mainSiteUrl()) return undefined
  const site = await getSiteByUrl(url)
  // getSiteByUrl is a host + path prefix match, we want an exact one
  if (!site || new URL(url).pathname.replace(/\/$/, '') !== (site.path ?? '')) return null
  return site
}

export const resolveResource = async (ctx: IssuerContext, resource: string | undefined): Promise<ResolvedResource> => {
  if (resource === undefined) return { kind: 'api', site: ctx.site, siteUrl: ctx.siteUrl, audience: ctx.siteUrl }
  let url: URL
  try { url = new URL(resource) } catch (err) { throw new ResourceError('invalid resource uri') }
  if (url.search || url.hash) throw new ResourceError('resource must not have a query or fragment')
  if (url.protocol !== new URL(ctx.siteUrl).protocol) throw new ResourceError('unsupported resource scheme')
  const normalized = stripSlash(url.origin + url.pathname)

  let kind: 'api' | 'mcp' = 'api'
  let siteUrl = normalized
  let site = await findSite(normalized)
  if (site === null) {
    const idx = normalized.indexOf(config.mcpPath + '/')
    if (idx > 0) {
      siteUrl = normalized.slice(0, idx)
      site = await findSite(siteUrl)
      kind = 'mcp'
    }
  }
  if (site === null) throw new ResourceError('unknown resource ' + resource)

  const realm = await resolveAccountMainSite(site)
  if (realm?._id !== ctx.site?._id) throw new ResourceError('resource outside of the issuer realm ' + resource)

  return {
    kind,
    site,
    siteUrl,
    audience: kind === 'mcp' ? [siteUrl + config.mcpPath, siteUrl] : siteUrl
  }
}

// same department-tolerant ownership comparison as getDefaultUserOrg: a site or an nhi org without
// department matches every department of the same organization
export const siteOwnedByNhiOrg = (site: Site, userOrg: { id: string, department?: string }) =>
  site.owner.type === 'organization' && site.owner.id === userOrg.id &&
  (!userOrg.department || !site.owner.department || userOrg.department === site.owner.department)

// the resource site must be the main site or a site owned by the nhi's org
export const assertNhiMayTarget = (nhi: User, resource: ResolvedResource) => {
  const userOrg = nhi.organizations[0]
  if (resource.site && (!userOrg || !siteOwnedByNhiOrg(resource.site, userOrg))) {
    throw new ResourceError('site not owned by the nhi organization')
  }
}
