import { type Account, type AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'
import { ownerFilter, exactOwnerFilter } from '../utils/owner-filter.ts'

export type Avatar = { owner: Account, initials?: string, color?: string, robot?: boolean, buffer: BinaryData }

export async function setAvatar (avatar: Avatar) {
  await mongo.avatars.replaceOne(exactOwnerFilter(avatar.owner), avatar, { upsert: true })
}

export async function getAvatar (owner: AccountKeys) {
  const avatar = await mongo.avatars.findOne(exactOwnerFilter(owner))
  if (avatar && avatar.buffer) avatar.buffer = (avatar.buffer as any).buffer
  return avatar as Avatar
}

// Drop the avatars of a deleted account (an organization owner without a department also
// drops the avatars of all its departments).
export async function deleteAvatars (owner: AccountKeys) {
  await mongo.avatars.deleteMany(ownerFilter(owner))
}

// Drop the avatars of the departments of an organization that are not in the given list,
// after the list of departments was replaced.
export async function deleteOtherDepartmentsAvatars (orgId: string, departmentIds: string[]) {
  await mongo.avatars.deleteMany({ ...ownerFilter({ type: 'organization', id: orgId }), 'owner.department': { $exists: true, $nin: departmentIds } })
}

// Drop a custom avatar document so the default initials avatar is regenerated on next read.
export async function deleteCustomAvatar (owner: AccountKeys) {
  await mongo.avatars.deleteOne(exactOwnerFilter(owner))
}
