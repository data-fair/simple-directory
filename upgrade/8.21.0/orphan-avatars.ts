import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

// Avatars used to survive the deletion of their owner (user, organization or department): the
// uploaded ones kept serving a picture of a deleted account, the generated ones only wasted space.
// Owners are now dropped along with their avatars, this purges the ones orphaned before that.
const upgradeScript: UpgradeScript = {
  description: 'Delete the avatars whose owner does not exist any more',
  async exec (db, debug) {
    const avatars = db.collection<{ owner: { type: string, id: string, department?: string } }>('avatars')
    let nbDeleted = 0
    for await (const avatar of avatars.find({}, { projection: { owner: 1 } })) {
      const { type, id, department } = avatar.owner
      let exists = false
      if (type === 'user') {
        exists = !!await db.collection('users').findOne({ _id: id as any }, { projection: { _id: 1 } })
      } else if (type === 'organization') {
        const filter: any = { _id: id }
        if (department) filter['departments.id'] = department
        exists = !!await db.collection('organizations').findOne(filter, { projection: { _id: 1 } })
      }
      if (exists) continue
      await avatars.deleteOne({ _id: avatar._id })
      nbDeleted++
    }
    debug(`deleted ${nbDeleted} orphan avatars`)
  }
}

export default upgradeScript
