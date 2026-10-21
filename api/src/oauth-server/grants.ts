// SD's record of each authorization granted to an OAuth client: what people see, audit and revoke.
// Stored as the sd field of the provider's own Grant document (oauth-grant collection), so that
// whatever destroys the Grant (revocation, reuse detection, expiry) also removes the record.
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import mongo from '#mongo'
import { MongoAdapter } from './adapter.ts'

export type OAuthGrantRecord = {
  _id: string,
  issuer: string,
  // undefined = the global main site
  siteId?: string,
  clientId: string,
  clientName: string,
  clientKind: 'site' | 'cimd' | 'dcr',
  subject: { type: 'user' | 'nhi', id: string },
  account: { type: 'user' | 'organization', id: string, department?: string },
  scope: string,
  resources: string[],
  authorizedBy: { id: string, name: string },
  // the server session of the consent, revoked with it
  sessionId?: string,
  createdAt: Date,
  expiresAt: Date,
  lastUsedAt?: Date
}

type GrantDoc = { _id: string, payload: Record<string, unknown>, expiresAt?: Date, sd?: Omit<OAuthGrantRecord, '_id'> }

export type GrantFilter = { subjectId?: string, clientId?: string, authorizedById?: string, sessionId?: string }

export const grantLifetimes = { '1d': 86400, '7d': 604800, '30d': 2592000, '90d': 7776000, '1y': 31557600 }
export const dashboardGrantLifetime = grantLifetimes['30d']

const grantDocs = () => mongo.db.collection<GrantDoc>('oauth-grant')

const toRecord = (doc: GrantDoc | null): OAuthGrantRecord | undefined => {
  // the TTL monitor runs about once a minute, so expiry is also checked on read
  if (!doc?.sd || doc.sd.expiresAt.getTime() <= Date.now()) return undefined
  return { _id: doc._id, ...doc.sd }
}

// on the Grant document the provider just saved
export const saveGrantRecord = async (grantId: string, record: Omit<OAuthGrantRecord, '_id'>) => {
  const { matchedCount } = await grantDocs().updateOne({ _id: grantId }, { $set: { sd: record } })
  if (!matchedCount) throw new Error(`no provider grant ${grantId}`)
}

export const getGrantRecord = async (grantId: string) => toRecord(await grantDocs().findOne({ _id: grantId }))

const filterKeys: Record<keyof GrantFilter, string> = {
  subjectId: 'sd.subject.id',
  clientId: 'sd.clientId',
  authorizedById: 'sd.authorizedBy.id',
  sessionId: 'sd.sessionId'
}

const toMongoFilter = (filter: GrantFilter) => {
  const query: Record<string, unknown> = { sd: { $exists: true } }
  for (const [key, path] of Object.entries(filterKeys)) {
    const value = filter[key as keyof GrantFilter]
    if (value) query[path] = value
  }
  return query
}

export const listGrantRecords = async (filter: GrantFilter) => {
  const docs = await grantDocs().find({ ...toMongoFilter(filter), 'sd.expiresAt': { $gt: new Date() } }).sort({ 'sd.createdAt': -1 }).toArray()
  return docs.map(toRecord).filter(r => r !== undefined)
}

export const touchGrantRecord = async (grantId: string) => {
  await grantDocs().updateOne({ _id: grantId, sd: { $exists: true } }, { $set: { 'sd.lastUsedAt': new Date() } })
}

// the provider's documents of the grant (access tokens are JWTs, never stored) then the Grant
// itself with its record
export const revokeGrant = async (grantId: string, reason: string, logContext: EventLogContext = {}) => {
  for (const model of ['RefreshToken', 'AuthorizationCode']) {
    await new MongoAdapter(model).revokeByGrantId(grantId)
  }
  const doc = await grantDocs().findOneAndDelete({ _id: grantId })
  if (!doc?.sd) return false
  eventsLog.info('sd.oauth.grant.revoked', `oauth grant ${grantId} of client ${doc.sd.clientId} revoked: ${reason}`, logContext)
  return true
}

export const revokeGrants = async (filter: GrantFilter, reason: string, logContext?: EventLogContext) => {
  // an empty filter would revoke every grant of the platform
  if (!Object.keys(filterKeys).some(key => filter[key as keyof GrantFilter])) throw new Error('revokeGrants needs a filter')
  let count = 0
  for (const doc of await grantDocs().find(toMongoFilter(filter), { projection: { _id: 1 } }).toArray()) {
    if (await revokeGrant(doc._id, reason, logContext)) count++
  }
  return count
}

// everything a user can lose control of: their own grants and the NHI grants they authorized
export const revokeUserGrants = async (userId: string, reason: string, logContext?: EventLogContext) =>
  await revokeGrants({ subjectId: userId }, reason, logContext) + await revokeGrants({ authorizedById: userId }, reason, logContext)
