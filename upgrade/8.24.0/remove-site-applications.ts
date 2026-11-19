import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

const upgradeScript: UpgradeScript = {
  description: 'Remove the unused external applications from sites',
  async exec (db, debug) {
    const res = await db.collection('sites').updateMany({ applications: { $exists: true } }, { $unset: { applications: '' } })
    debug(`Removed applications from ${res.modifiedCount} sites`)
  }
}

export default upgradeScript
