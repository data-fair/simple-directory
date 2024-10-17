import type {Limits} from '#types'
import config from '#config'
import mongo from '#mongo'
import { reqUser, httpError, type Account } from '@data-fair/lib-express'

export const  getLimits = async (consumer: Account) => {
  let limit: Limits | null = await mongo.limits.findOne({ type: consumer.type, id: consumer.id }, {projection: {_id: 0}})
  if (!limit || !limit.store_nb_members) {
    limit = {
      type: consumer.type,
      id: consumer.id,
      name: consumer.name || consumer.id,
      lastUpdate: new Date().toISOString(),
      store_nb_members: { limit: config.quotas.defaultMaxNbMembers }
    }
    await mongo.limits.replaceOne({ type: consumer.type, id: consumer.id }, limit, { upsert: true })
  }
  if (limit.store_nb_members.consumption === undefined) {
    if (consumer.type === 'organization') limit = await setNbMembers(consumer.id)
    else limit.store_nb_members.consumption = 1
  }
  if (limit.store_nb_members.limit === undefined) {
    limit.store_nb_members.limit = config.quotas.defaultMaxNbMembers
  }
  return limit
}

export const  setNbMembers = async (organizationId: string) => {
  const nbMembers =  await mongo.users.countDocuments({ 'organizations.id': organizationId, plannedDeletion: { $exists: false } })
  const limits = await mongo.limits
    .findOneAndUpdate({ type: 'organization', id: organizationId }, { $set: { ['store_nb_members.consumption': value } }, { returnDocument: 'after', upsert: true })
  if (!limits) throw httpError(404, 'impossible error')
  return limits
}

export const  updateName = async (identity: Account) => {
  await mongo.limits
    .updateMany({ type: identity.type, id: identity.id }, { $set: { name: identity.name } })
}
