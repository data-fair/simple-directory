import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

// Until this release, deleting a user never recomputed store_nb_members.consumption of the
// organizations they belonged to, so an organization whose last member was deleted kept showing
// members forever. 8.2.0/missing-member-limits.ts already fixed the data once, but the source of
// the drift stayed until now, so the counters have to be recomputed a second time.
const upgradeScript: UpgradeScript = {
  description: 'Recompute the denormalized member count of every organization',
  async exec (db, debug) {
    let fixed = 0
    for await (const org of db.collection('organizations').find({}, { projection: { _id: 1 } })) {
      const nbMembers = await db.collection('users')
        .countDocuments({ 'organizations.id': org._id, plannedDeletion: { $exists: false } })
      const res = await db.collection('limits').updateOne(
        { type: 'organization', id: org._id, 'store_nb_members.consumption': { $ne: nbMembers } },
        { $set: { 'store_nb_members.consumption': nbMembers } }
      )
      fixed += res.modifiedCount
    }
    debug(`recomputed the member count of ${fixed} organizations`)
  }
}

export default upgradeScript
