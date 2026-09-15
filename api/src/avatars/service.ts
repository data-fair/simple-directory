import { type Account, type AccountKeys } from '@data-fair/lib-express'
import mongo from '#mongo'

export type Avatar = { owner: Account, initials?: string, color?: string, robot?: boolean, buffer: BinaryData }

const ownerFilter = (owner: AccountKeys) => {
  const filter: any = { 'owner.type': owner.type, 'owner.id': owner.id }
  if (owner.department) filter['owner.department'] = owner.department
  return filter
}

export async function setAvatar (avatar: Avatar) {
  await mongo.avatars.replaceOne(ownerFilter(avatar.owner), avatar, { upsert: true })
}

export async function getAvatar (owner: AccountKeys) {
  const avatar = await mongo.avatars.findOne(ownerFilter(owner))
  if (avatar && avatar.buffer) avatar.buffer = (avatar.buffer as any).buffer
  return avatar as Avatar
}

// Drop the avatars of a deleted account. Without a department, an organization owner also
// drops the avatars of all its departments (same owner.id, any owner.department).
export async function deleteAvatars (owner: AccountKeys) {
  await mongo.avatars.deleteMany(ownerFilter(owner))
}
