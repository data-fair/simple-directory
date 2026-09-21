import type { AccountKeys } from '@data-fair/lib-express'

// Mongo filter on the documents keyed by an account owner ({ type, id, department? }),
// avatars and sites. Without a department, every department of the account matches.
export const ownerFilter = (owner: AccountKeys) => {
  const filter: any = { 'owner.type': owner.type, 'owner.id': owner.id }
  if (owner.department) filter['owner.department'] = owner.department
  return filter
}

// Same but on exactly one owner: an organization does not match its departments
// (the owner of an organization root has no department key at all, cf ignoreUndefined)
export const exactOwnerFilter = (owner: AccountKeys) => ({
  'owner.type': owner.type,
  'owner.id': owner.id,
  'owner.department': owner.department ?? { $exists: false }
})
