import { strict as assert } from 'node:assert'
import { test } from '@playwright/test'
import { initMongo } from '../support/unit.ts'

// Exercises the upgrade script that purges the avatars whose owner was deleted before avatars
// were dropped along with their owner (in-process Mongo, no HTTP server needed)
test.describe('orphan avatars upgrade script', () => {
  let mongo: any

  test.beforeAll(async () => {
    await initMongo()
    mongo = (await import('../../api/src/mongo.ts')).default
  })

  test('should delete the avatars whose owner does not exist any more, and keep the others', async () => {
    const prefix = 'test_orphan_avatar_'
    await mongo.users.deleteMany({ _id: { $regex: '^' + prefix } })
    await mongo.organizations.deleteMany({ _id: { $regex: '^' + prefix } })
    await mongo.avatars.deleteMany({ 'owner.id': { $regex: '^' + prefix } })

    await mongo.users.insertOne({ _id: prefix + 'user', email: prefix + 'user@test.com', name: 'Kept user', organizations: [] })
    await mongo.organizations.insertOne({ _id: prefix + 'org', name: 'Kept org', departments: [{ id: 'kept', name: 'Kept dep' }] })
    const buffer = Buffer.from('png')
    await mongo.avatars.insertMany([
      { owner: { type: 'user', id: prefix + 'user' }, buffer },
      { owner: { type: 'user', id: prefix + 'deleted-user' }, buffer },
      { owner: { type: 'organization', id: prefix + 'org' }, buffer },
      { owner: { type: 'organization', id: prefix + 'org', department: 'kept' }, buffer },
      { owner: { type: 'organization', id: prefix + 'org', department: 'removed' }, buffer },
      { owner: { type: 'organization', id: prefix + 'deleted-org' }, buffer },
      { owner: { type: 'organization', id: prefix + 'deleted-org', department: 'dep' }, buffer }
    ])

    const upgradeScript = (await import('../../upgrade/8.21.0/orphan-avatars.ts')).default
    const debug = (await import('debug')).default('test:upgrade')
    // run it twice, upgrade scripts must be idempotent
    await upgradeScript.exec(mongo.db, debug)
    await upgradeScript.exec(mongo.db, debug)

    const remaining = await mongo.avatars.find({ 'owner.id': { $regex: '^' + prefix } }, { projection: { _id: 0, owner: 1 } }).toArray()
    const key = (owner: any) => `${owner.type}/${owner.id}/${owner.department ?? ''}`
    assert.deepEqual(remaining.map((a: any) => key(a.owner)).sort(), [
      `organization/${prefix}org/`,
      `organization/${prefix}org/kept`,
      `user/${prefix}user/`
    ])

    await mongo.users.deleteMany({ _id: { $regex: '^' + prefix } })
    await mongo.organizations.deleteMany({ _id: { $regex: '^' + prefix } })
    await mongo.avatars.deleteMany({ 'owner.id': { $regex: '^' + prefix } })
  })
})
