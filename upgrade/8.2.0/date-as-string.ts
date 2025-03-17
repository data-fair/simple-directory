import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

const upgradeScript: UpgradeScript = {
  description: 'Change type of some Date objects in db',
  async exec (db, debug) {
    let nbUsers = 0
    for await (const doc of db.collection('users').find({ 'created.date': { $type: 'date' } }).project({ 'created.date': 1 })) {
      await db.collection('users').updateOne({ _id: doc._id }, { $set: { 'created.date': doc.created.date.toISOString() } })
      nbUsers++
    }
    for await (const doc of db.collection('users').find({ 'updated.date': { $type: 'date' } }).project({ 'updated.date': 1 })) {
      await db.collection('users').updateOne({ _id: doc._id }, { $set: { 'updated.date': doc.updated.date.toISOString() } })
      nbUsers++
    }
    debug(`Updated ${nbUsers} users`)
    let nbOrgs = 0
    for await (const doc of db.collection('organizations').find({ 'created.date': { $type: 'date' } }).project({ 'created.date': 1 })) {
      await db.collection('organizations').updateOne({ _id: doc._id }, { $set: { 'created.date': doc.created.date.toISOString() } })
      nbOrgs++
    }
    for await (const doc of db.collection('organizations').find({ 'updated.date': { $type: 'date' } }).project({ 'updated.date': 1 })) {
      await db.collection('organizations').updateOne({ _id: doc._id }, { $set: { 'updated.date': doc.updated.date.toISOString() } })
      nbOrgs++
    }
    debug(`Updated ${nbOrgs} organizations`)
  }
}

export default upgradeScript
