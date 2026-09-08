import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

// Until this release, several paths lost a membership without recomputing
// store_nb_members.consumption: user deletion, a core identity provider dropping a readOnly
// membership, the deletion of a temporary user. An organization whose last member left that way
// kept showing members forever. 8.2.0/missing-member-limits.ts already fixed the data once, but
// the sources of the drift stayed until now, so the counters have to be recomputed a second time.
// The filter below mirrors getNbMembers exactly, NHI exclusion included, so a recompute can never
// disagree with what the running code counts. No released version has NHIs yet, so this part
// repairs nothing today -- it just keeps the two queries from drifting apart.
const upgradeScript: UpgradeScript = {
  description: 'Recompute the denormalized member count of every organization',
  async exec (db, debug) {
    let fixed = 0
    for await (const org of db.collection('organizations').find({}, { projection: { _id: 1 } })) {
      const nbMembers = await db.collection('users')
        .countDocuments({ 'organizations.id': org._id, plannedDeletion: { $exists: false }, nhi: { $exists: false } })
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
