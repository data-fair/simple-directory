import type { Organization, Limits } from '#types'
import config from '#config'
import mongo from '#mongo'
import { httpError } from '@data-fair/lib-express'

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
  // counted on the fly from the organization document, so they never drift; -1 means unlimited, 0 means none
  return {
    ...limit,
    store_nb_departments: { limit: limit.store_nb_departments?.limit ?? config.quotas.defaultMaxNbDepartments, consumption: org.departments?.length ?? 0 },
    store_nb_partners: { limit: limit.store_nb_partners?.limit ?? config.quotas.defaultMaxNbPartners, consumption: org.partners?.length ?? 0 }
  }
}

// only an increase is refused, an organization over its quota can still rename or remove
export const assertNbDepartmentsLimit = async (org: Organization, newNbDepartments: number, message: string) => {
  if (newNbDepartments <= (org.departments?.length ?? 0)) return
  const { limit } = (await getOrgLimits(org)).store_nb_departments
  if (limit !== -1 && newNbDepartments > limit) throw httpError(429, message)
}

export const assertNbPartnersLimit = async (org: Organization, message: string) => {
  const { limit, consumption } = (await getOrgLimits(org)).store_nb_partners
  if (limit !== -1 && consumption >= limit) throw httpError(429, message)
}

// NHIs count as members here: they hold an org membership like humans do and consume the same quota,
// even though findMembers hides them by default
const getNbMembers = async (orgId: string) => {
  return mongo.users.countDocuments({ 'organizations.id': orgId, plannedDeletion: { $exists: false } })
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
