import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

// Avatars used to survive the deletion of their owner (user, organization or department): the
// uploaded ones kept serving a picture of a deleted account, the generated ones only wasted space.
// Owners are now dropped along with their avatars, this purges the ones orphaned before that.
const upgradeScript: UpgradeScript = {
  description: 'Delete the avatars whose owner does not exist any more',
  async exec (db, debug) {
    const avatars = db.collection<{ owner: { type: string, id: string, department?: string } }>('avatars')

    // the avatars collection grows with the number of accounts: resolve the existing owners in
    // a few set queries rather than one lookup per avatar
    const userIds = await avatars.distinct('owner.id', { 'owner.type': 'user' })
    const users = await db.collection('users').find({ _id: { $in: userIds } }, { projection: { _id: 1 } }).toArray()
    const existingUsers = new Set(users.map(u => u._id as unknown as string))

    const orgIds = await avatars.distinct('owner.id', { 'owner.type': 'organization' })
    const orgs = await db.collection<{ departments?: { id: string }[] }>('organizations').find({ _id: { $in: orgIds } }, { projection: { 'departments.id': 1 } }).toArray()
    const existingDepartments = new Map(orgs.map(o => [o._id as unknown as string, new Set((o.departments ?? []).map(d => d.id))]))

    const orphans: any[] = []
    for await (const avatar of avatars.find({}, { projection: { owner: 1 } })) {
      const { type, id, department } = avatar.owner
      const exists = type === 'user'
        ? existingUsers.has(id)
        : type === 'organization' && existingDepartments.has(id) && (!department || existingDepartments.get(id)!.has(department))
      if (!exists) orphans.push(avatar._id)
    }
    const res = await avatars.deleteMany({ _id: { $in: orphans } })
    debug(`deleted ${res.deletedCount} orphan avatars`)
  }
}

export default upgradeScript
