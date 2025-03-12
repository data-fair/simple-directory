import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

const upgradeScript: UpgradeScript = {
  description: 'Fill missing passwordUpdate.last property',
  async exec (db, debug) {
    const result = await db.collection('users').updateMany(
      { password: { $exists: true }, 'passwordUpdate.last': { $exists: false } },
      { $set: { passwordUpdate: { last: new Date().toISOString() } } }
    )
    debug(`Updated ${result.modifiedCount} users`)
  }
}

export default upgradeScript
