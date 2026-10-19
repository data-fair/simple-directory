import config from '#config'
import mongo from '#mongo'
import { scopeRegexp } from '@data-fair/lib-express'
import { privateAxiosInstance } from '@data-fair/lib-node/axios.js'
import { internalError } from '@data-fair/lib-node/observer.js'

type ScopesMap = Record<string, string>
// ok: the last fetch succeeded (the etag is optional, its absence says nothing about success)
type Entry = { checkedAt: number, ok: boolean, etag?: string, scopes: ScopesMap }

// The platform scopes come from data-fair. This is a soft dependency: simple-directory never
// blocks on it, it serves the last list it received (memory, then mongo) and only its own
// scopes when it never received one. The list only decides what admins may store on an NHI,
// it is not checked at token exchange time.
const ttl = 5 * 60 * 1000
const failureTtl = 30 * 1000
const maxDescriptionLength = 500
const memory = new Map<string, Entry>()

export const clearPlatformScopesCache = () => { memory.clear() }

const validScopes = (raw: any): ScopesMap => {
  const scopes: ScopesMap = {}
  if (!raw || typeof raw !== 'object') return scopes
  for (const [name, description] of Object.entries(raw)) {
    if (scopeRegexp.test(name) && typeof description === 'string') scopes[name] = description.slice(0, maxDescriptionLength)
  }
  return scopes
}

const fetchPlatformScopes = async (localeCode: string): Promise<ScopesMap> => {
  if (!config.platformScopesUrl) return {}
  const cached = memory.get(localeCode)
  if (cached && Date.now() - cached.checkedAt < (cached.ok ? ttl : failureTtl)) return cached.scopes
  let stored: Entry | undefined = cached
  if (!stored) {
    try {
      const doc = await mongo.platformScopes.findOne({ _id: localeCode })
      if (doc) stored = { checkedAt: 0, ok: true, etag: doc.etag, scopes: doc.scopes }
    } catch (err) {
      // no stored copy, never thrown into the request
      internalError('platform-scopes', 'failed to read the stored platform scopes', err)
    }
  }
  let entry: Entry
  try {
    const headers: Record<string, string> = { 'accept-language': localeCode }
    if (stored?.etag) headers['if-none-match'] = stored.etag
    const res = await privateAxiosInstance.get(config.platformScopesUrl, { headers, timeout: 5000, validateStatus: status => status === 200 || status === 304 })
    if (res.status === 304 && stored) {
      entry = { ...stored, ok: true, checkedAt: Date.now() }
    } else {
      entry = { checkedAt: Date.now(), ok: true, etag: res.headers.etag, scopes: validScopes(res.data?.scopes) }
      try {
        await mongo.platformScopes.replaceOne({ _id: localeCode }, { etag: entry.etag, scopes: entry.scopes }, { upsert: true })
      } catch (err) {
        // the fetched list is still good, only its persistence failed
        internalError('platform-scopes', 'failed to store the platform scopes', err)
      }
    }
  } catch (err) {
    internalError('platform-scopes', 'failed to fetch the platform scopes', err)
    // keep serving the last list received, retry sooner than after a success
    entry = { checkedAt: Date.now(), ok: false, etag: stored?.etag, scopes: stored?.scopes ?? {} }
  }
  memory.set(localeCode, entry)
  return entry.scopes
}

// own scopes win over a platform entry with the same name
export const getKnownScopes = async (localeCode: string, ownScopes: ScopesMap): Promise<ScopesMap> => {
  return { ...await fetchPlatformScopes(localeCode), ...ownScopes }
}
