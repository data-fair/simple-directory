import type { Organization, Limits } from '#types'
import config from '#config'
import mongo from '#mongo'

export const getOrgLimits = async (org: Organization) => {
  let limit: Limits | null = await mongo.limits.findOne({ type: 'organization', id: org.id }, { projection: { _id: 0 } })
  if (!limit || !limit.store_nb_members) {
    limit = {
      type: 'organization',
      id: org.id,
      name: org.name,
      lastUpdate: new Date().toISOString(),
      store_nb_members: { limit: config.quotas.defaultMaxNbMembers, consumption: await getNbMembers(org.id) }
    }
    await mongo.limits.replaceOne({ type: 'organization', id: org.id }, limit, { upsert: true })
  }
  return limit
}

// NHIs are not members: findMembers excludes them by default, this query has to do the same
const getNbMembers = async (orgId: string) => {
  return mongo.users.countDocuments({ 'organizations.id': orgId, plannedDeletion: { $exists: false }, nhi: { $exists: false } })
}

export const setNbMembersLimit = async (orgId: string) => {
  const nbMembers = await getNbMembers(orgId)
  await mongo.limits
    .updateOne({ type: 'organization', id: orgId }, { $set: { 'store_nb_members.consumption': nbMembers } })
}

// deleting a user or syncing memberships from a core identity provider impacts several organizations at once
export const setNbMembersLimits = async (orgIds: string[] | Set<string>) => {
  for (const orgId of new Set(orgIds)) await setNbMembersLimit(orgId)
}

// limits are keyed by identity, they are dead weight once the identity is deleted
export const deleteIdentityLimits = async (type: 'user' | 'organization', id: string) => {
  await mongo.limits.deleteOne({ type, id })
}

/* export const updateName = async (identity: Account) => {
  await mongo.limits
    .updateMany({ type: identity.type, id: identity.id }, { $set: { name: identity.name } })
} */
