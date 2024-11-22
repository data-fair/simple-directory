import config from '#config'
import { type Site, type SitePublic } from '#types'
import { type Request } from 'express'
import { reqSiteUrl, httpError, type Account } from '@data-fair/lib-express'
import mongo from '#mongo'
import memoize from 'memoizee'

export const getSiteByUrl = memoize(async (url: string) => {
  const urlObj = new URL(url)
  const sites = await mongo.sites.find({ host: urlObj.host }).toArray()
  return sites.find(s => urlObj.pathname.startsWith(s.path ?? ''))
}, {
  promise: true,
  maxAge: 2000 // 2s
})

export const reqSite = async (req: Request): Promise<Site | undefined> => {
  const siteUrl = reqSiteUrl(req)
  if (siteUrl && !config.publicUrl.startsWith(siteUrl) && siteUrl !== `http://simple-directory:${config.port}` && !(process.env.NODE_ENV === 'production' && siteUrl === `http://localhost:${config.port}`)) {
    if (!config.manageSites) throw httpError(400, `multi-sites not supported by this install of simple-directory, url=${siteUrl}, declared url=${config.publicUrl}`)
    const site = await getSiteByUrl(siteUrl)
    if (!site) throw httpError(404, 'unknown site')
    return site
  }
}

export async function findOwnerSites (owner: Account) {
  const filter: any = { 'owner.type': owner.type, 'owner.id': owner.id }
  if (owner.department) filter['owner.department'] = owner.department
  const sites = await mongo.sites.find(filter).limit(10000)
    .project({ host: 1, theme: 1, logo: 1, reducedPersonalInfoAtCreation: 1, tosMessage: 1, authMode: 1, authOnlyOtherSite: 1 })
    .toArray()
  return {
    count: sites.length,
    results: sites as SitePublic[]
  }
}

export async function findAllSites () {
  const sites = await mongo.sites.find().limit(10000).toArray()
  return {
    count: sites.length,
    results: sites
  }
}

export async function patchSite (patch: Partial<Site> & Pick<Site, '_id'>, createIfMissing = false) {
  return (await mongo.sites.findOneAndUpdate({ _id: patch._id }, { $set: patch }, { upsert: createIfMissing, returnDocument: 'after' })) as Site
}

export async function deleteSite (siteId: string) {
  await mongo.sites.deleteOne({ _id: siteId })
}

export function getSiteColors (site: Site) {
  const colors = { ...config.theme.colors }
  colors['text-primary'] = colors['text-primary'] ?? colors.primary
  colors['text-secondary'] = colors['text-secondary'] ?? colors.secondary
  if (site.theme?.primaryColor) colors.primary = site.theme?.primaryColor
  return colors
}
