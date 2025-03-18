import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'
import type { Db } from 'mongodb'

export const setNbMembersLimit = async (db: Db, orgId: string) => {
  const nbMembers = await db.collection('users').countDocuments({ 'organizations.id': orgId, plannedDeletion: { $exists: false } })
  await db.collection('limits').updateOne({ type: 'organization', id: orgId }, { $set: { 'store_nb_members.consumption': nbMembers } })
}

const upgradeScript: UpgradeScript = {
  description: 'Recalculate member limits',
  async exec (db, debug) {
    for await (const doc of db.collection('organizations').find().project({ _id: 1 })) {
      await setNbMembersLimit(db, doc._id)
    }
  }
}

export default upgradeScript
