import config from '#config'
import { type Site } from '#types'
import { type Request } from 'express'
import { reqHost, httpError, type Account } from '@data-fair/lib-express'
import mongo from '#mongo'
import memoize from 'memoizee'

export const getSiteByHost = memoize(async (host: string) => {
  return await mongo.sites.findOne({ host })
}, {
  promise: true,
  maxAge: 2000 // 2s
})

const publicUrl = new URL(config.publicUrl)

export const reqSite = async (req: Request): Promise<Site | undefined> => {
  const host = reqHost(req)
  if (host && ![publicUrl.host, `simple-directory:${config.port}`].includes(host) && !(process.env.NODE_ENV === 'production' && host === `localhost:${config.port}`)) {
    if (!config.manageSites) throw httpError(400, `multi-sites not supported by this install of simple-directory, host=${host}, declared host=${publicUrl.host}`)
    const site = await getSiteByHost(host)
    if (!site) throw httpError(404, 'unknown site')
    return site
  }
}

export async function findOwnerSites (owner: Account) {
  const filter: any = { 'owner.type': owner.type, 'owner.id': owner.id }
  if (owner.department) filter['owner.department'] = owner.department
  const sites = await mongo.sites.find(filter).limit(10000).toArray()
  return {
    count: sites.length,
    results: sites
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
  await mongo.sites.updateOne({ _id: patch._id }, { $set: patch }, { upsert: createIfMissing })
}

export async function deleteSite (siteId: string) {
  await mongo.sites.deleteOne({ _id: siteId })
}
