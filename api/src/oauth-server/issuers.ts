import config from '#config'
import { internalError } from '@data-fair/lib-node/observer.js'
import type { Request } from 'express'
import type { Site } from '#types'
import { reqSiteUrl } from '@data-fair/lib-express'
import { getSiteByUrl, resolveAccountMainSite, findMainSite, reqSite } from '../sites/service.ts'

export type IssuerContext = { issuer: string, site: Site | undefined, siteUrl: string }
export type ResolvedResource = { kind: 'api' | 'mcp', site: Site | undefined, siteUrl: string, audience: string | string[] }

// thrown for any unknown or out-of-realm resource, callers map it to invalid_target
export class ResourceError extends Error {}

const stripSlash = (s: string) => s.replace(/\/+$/, '')

// config.publicUrl may include the /simple-directory path (dev/test), the site url never does
export const mainSiteUrl = () => {
  const url = new URL(config.publicUrl)
  return url.origin + stripSlash(url.pathname).replace(/\/simple-directory$/, '')
}

// the site of a request comes from a host + path prefix lookup while its url comes from the request
// itself: they must agree, or the default audience (siteUrl) could name a site of another realm
const isCanonicalSiteUrl = (site: Site, siteUrl: string) => {
  let url: URL
  try { url = new URL(siteUrl) } catch { return false }
  return url.host === site.host.toLowerCase() && siteUrl === url.origin + (site.path ?? '')
}

export const issuerOfSite = async (site: Site | undefined, siteUrl: string): Promise<IssuerContext | null> => {
  siteUrl = stripSlash(siteUrl)
  if (!site) {
    if (siteUrl !== mainSiteUrl()) return null
    return { issuer: stripSlash(config.publicUrl), site, siteUrl }
  }
  if (!isCanonicalSiteUrl(site, siteUrl)) return null
  let isIssuer = !!site.isAccountMain
  if (!isIssuer && site.authMode === 'onlyLocal') {
    // a standalone site only: an owner with a designated main site delegates to it
    isIssuer = !await findMainSite(site.owner)
  }
  if (!isIssuer) return null
  // an issuer site must be its own account main site (an isAccountMain site left in onlyBackOffice is not)
  if ((await resolveAccountMainSite(site))?._id !== site._id) return null
  return { issuer: siteUrl + '/simple-directory', site, siteUrl }
}

// canonical form expected by issuerOfSite: origin + path without trailing slash
export const canonicalSiteUrl = (siteUrl: string) => {
  const url = new URL(siteUrl)
  return url.origin + url.pathname.replace(/\/+$/, '')
}

// the issuer of a request's site, null when the site is not an issuer
export const reqIssuer = async (req: Request) => await issuerOfSite(await reqSite(req), canonicalSiteUrl(reqSiteUrl(req)))

// undefined = main site, null = unknown
const findSite = async (url: string): Promise<Site | undefined | null> => {
  if (url === mainSiteUrl()) return undefined
  const site = await getSiteByUrl(url)
  // getSiteByUrl is a host + path prefix match, we want an exact one
  if (!site || new URL(url).pathname.replace(/\/$/, '') !== (site.path ?? '')) return null
  return site
}

export const resolveResource = async (ctx: IssuerContext, resource: string | undefined): Promise<ResolvedResource> => {
  try {
    return await doResolveResource(ctx, resource)
  } catch (err) {
    if (err instanceof ResourceError) throw err
    // fail closed, but an infrastructure error must not pass silently as a client error
    internalError('oauth-resolve-resource', 'error while resolving an oauth resource', err)
    throw new ResourceError('invalid resource')
  }
}

const doResolveResource = async (ctx: IssuerContext, resource: string | undefined): Promise<ResolvedResource> => {
  if (resource === undefined) return { kind: 'api', site: ctx.site, siteUrl: ctx.siteUrl, audience: ctx.siteUrl }
  let url: URL
  try { url = new URL(resource) } catch (err) { throw new ResourceError('invalid resource uri') }
  if (url.search || url.hash) throw new ResourceError('resource must not have a query or fragment')
  if (url.username || url.password) throw new ResourceError('resource must not have credentials')
  if (url.pathname.includes('//')) throw new ResourceError('resource path must not have empty segments')
  if (url.protocol !== new URL(ctx.siteUrl).protocol) throw new ResourceError('unsupported resource scheme')
  const normalized = url.origin + stripSlash(url.pathname)

  let kind: 'api' | 'mcp' = 'api'
  let siteUrl = normalized
  let site = await findSite(normalized)
  if (site === null) {
    const idx = url.pathname.indexOf(config.mcpPath + '/')
    if (idx >= 0) {
      siteUrl = url.origin + stripSlash(url.pathname.slice(0, idx))
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

// an NHI (by its membership) may target the main site or a site owned by its organization
export const nhiMayTarget = (membership: { id: string, department?: string } | undefined, resource: ResolvedResource) =>
  !resource.site || (!!membership && siteOwnedByNhiOrg(resource.site, membership))
