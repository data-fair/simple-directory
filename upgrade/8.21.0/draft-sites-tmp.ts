import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

// data-fair-portals only started flagging its draft sites with tmp=true recently, so drafts
// synced before that still show up in the site lists meant for real, published sites. A draft is
// recognizable by its _id alone; published sites are left untouched because their tmp value
// depends on the portal ingress, which only portals knows and resyncs on the next save.
const upgradeScript: UpgradeScript = {
  description: 'Flag data-fair-portals draft sites as temporary',
  async exec (db, debug) {
    const res = await db.collection<{ _id: string, tmp?: boolean }>('sites').updateMany(
      { _id: { $regex: /^data-fair-portals:draft-/ }, tmp: { $ne: true } },
      { $set: { tmp: true } }
    )
    debug(`flagged ${res.modifiedCount} draft sites as tmp`)
  }
}

export default upgradeScript
