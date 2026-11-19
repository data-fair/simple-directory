import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

const upgradeScript: UpgradeScript = {
  description: 'Existing site OIDC providers keep the lenient behavior: strict and rpInitiatedLogout are set to false',
  async exec (db, debug) {
    for (const flag of ['strict', 'rpInitiatedLogout']) {
      const res = await db.collection('sites').updateMany(
        { authProviders: { $elemMatch: { type: 'oidc', [flag]: { $exists: false } } } },
        { $set: { [`authProviders.$[p].${flag}`]: false } },
        { arrayFilters: [{ 'p.type': 'oidc', [`p.${flag}`]: { $exists: false } }] }
      )
      debug(`Set ${flag}=false on the OIDC providers of ${res.modifiedCount} sites`)
    }
  }
}

export default upgradeScript
