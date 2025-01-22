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

const getNbMembers = async (orgId: string) => {
  return mongo.users.countDocuments({ 'organizations.id': orgId, plannedDeletion: { $exists: false } })
}

export const setNbMembersLimit = async (orgId: string) => {
  const nbMembers = await getNbMembers(orgId)
  await mongo.limits
    .updateOne({ type: 'organization', id: orgId }, { $set: { 'store_nb_members.consumption': nbMembers } })
}

/* export const updateName = async (identity: Account) => {
  await mongo.limits
    .updateMany({ type: identity.type, id: identity.id }, { $set: { name: identity.name } })
} */
