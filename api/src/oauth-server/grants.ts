// SD-owned record of each authorization granted to an OAuth client: what people see, audit and revoke.
// The provider Grant (oauth-grant collection) carries the same id.
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
  createdAt: Date,
  expiresAt: Date,
  lastUsedAt?: Date
}

export type GrantFilter = { subjectId?: string, clientId?: string }

export const grantLifetimes = { '1d': 86400, '7d': 604800, '30d': 2592000, '90d': 7776000, '1y': 31557600 }
export const dashboardGrantLifetime = grantLifetimes['30d']

export const createGrantRecord = async (record: OAuthGrantRecord) => {
  await mongo.oauthGrants.insertOne(record)
}

// the TTL monitor runs about once a minute, so expiry is also checked on read
export const getGrantRecord = async (grantId: string) => {
  const record = await mongo.oauthGrants.findOne({ _id: grantId })
  if (!record || record.expiresAt.getTime() <= Date.now()) return undefined
  return record
}

const toMongoFilter = (filter: GrantFilter) => {
  const query: Record<string, string> = {}
  if (filter.subjectId) query['subject.id'] = filter.subjectId
  if (filter.clientId) query.clientId = filter.clientId
  return query
}

export const listGrantRecords = async (filter: GrantFilter) => {
  return mongo.oauthGrants.find(toMongoFilter(filter)).sort({ createdAt: -1 }).toArray()
}

export const touchGrantRecord = async (grantId: string) => {
  await mongo.oauthGrants.updateOne({ _id: grantId }, { $set: { lastUsedAt: new Date() } })
}

// the record part of a revocation, alone when the provider already destroyed its own documents
// (its grant.revoked event)
export const revokeGrantRecord = async (grantId: string, reason: string, logContext: EventLogContext = {}) => {
  const record = await mongo.oauthGrants.findOneAndDelete({ _id: grantId })
  if (!record) return false
  eventsLog.info('sd.oauth.grant.revoked', `oauth grant ${grantId} of client ${record.clientId} revoked: ${reason}`, logContext)
  return true
}

export const revokeGrant = async (grantId: string, reason: string, logContext: EventLogContext = {}) => {
  for (const model of ['AccessToken', 'RefreshToken', 'AuthorizationCode']) {
    await new MongoAdapter(model).revokeByGrantId(grantId)
  }
  await new MongoAdapter('Grant').destroy(grantId)
  return await revokeGrantRecord(grantId, reason, logContext)
}

export const revokeGrants = async (filter: GrantFilter, reason: string, logContext?: EventLogContext) => {
  // an empty filter would revoke every grant of the platform
  if (!filter.subjectId && !filter.clientId) throw new Error('revokeGrants needs a subjectId or clientId filter')
  let count = 0
  for (const record of await mongo.oauthGrants.find(toMongoFilter(filter), { projection: { _id: 1 } }).toArray()) {
    if (await revokeGrant(record._id, reason, logContext)) count++
  }
  return count
}
