import type { AccountKeys } from '@data-fair/lib-express'

// Mongo filter on the documents keyed by an account owner ({ type, id, department? }),
// avatars and sites. Without a department, every department of the account matches.
export const ownerFilter = (owner: AccountKeys) => {
  const filter: any = { 'owner.type': owner.type, 'owner.id': owner.id }
  if (owner.department) filter['owner.department'] = owner.department
  return filter
}
