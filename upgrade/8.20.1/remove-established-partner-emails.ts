import type { UpgradeScript } from '@data-fair/lib-node/upgrade-scripts.js'

// The partner contact email is only useful during the invitation workflow. Once a partnership is
// established (the partner has an "id"), the email is unnecessary personal information that might
// become deprecated over time, so we remove it. Pending invitations (no "id" yet) keep their email.
const upgradeScript: UpgradeScript = {
  description: 'Remove the no longer needed contact email from established partnerships',
  async exec (db, debug) {
    const res = await db.collection('organizations').updateMany(
      { partners: { $elemMatch: { id: { $exists: true }, contactEmail: { $exists: true } } } },
      { $unset: { 'partners.$[partner].contactEmail': '' } },
      { arrayFilters: [{ 'partner.id': { $exists: true }, 'partner.contactEmail': { $exists: true } }] }
    )
    debug(`Removed contact email from established partnerships in ${res.modifiedCount} organizations`)
  }
}

export default upgradeScript
