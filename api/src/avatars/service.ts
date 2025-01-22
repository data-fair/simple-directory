import { type Account } from '@data-fair/lib-express'
import mongo from '#mongo'

export type Avatar = { owner: Account, initials?: string, color?: string, buffer: BinaryData }

export async function setAvatar (avatar: Avatar) {
  const filter: any = { 'owner.type': avatar.owner.type, 'owner.id': avatar.owner.id }
  if (avatar.owner.department) filter['owner.department'] = avatar.owner.department
  await mongo.avatars.replaceOne(filter, avatar, { upsert: true })
}

export async function getAvatar (owner: Account) {
  const filter: any = { 'owner.type': owner.type, 'owner.id': owner.id }
  if (owner.department) filter['owner.department'] = owner.department
  const avatar = await mongo.avatars.findOne(filter)
  if (avatar && avatar.buffer) avatar.buffer = (avatar.buffer as any).buffer
  return avatar as Avatar
}
