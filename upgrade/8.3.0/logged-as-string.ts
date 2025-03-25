import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

const upgradeScript: UpgradeScript = {
  description: 'Change type of user.logged property',
  async exec (db, debug) {
    let nbUsers = 0
    for await (const doc of db.collection('users').find({ logged: { $type: 'date' } }).project({ logged: 1 })) {
      await db.collection('users').updateOne({ _id: doc._id }, { $set: { logged: doc.logged.toISOString() } })
      nbUsers++
    }
    debug(`Updated ${nbUsers} users`)
  }
}

export default upgradeScript
