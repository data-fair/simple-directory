// A dense view of a list of scopes, for display only: the scopes that another scope of the list
// already implies are dropped, as the enforcing services accept them (acceptedScopes of
// lib-common-types): a bare umbrella implies the tiers of its family, a tier implies the lower
// tiers of its family, a global tier scope implies the same or lower tiers of every family.
// all:admin alone stays all:admin, whatever the rest of the list.
const tiers = ['read', 'write', 'admin']

const split = (scope: string) => {
  const sep = scope.indexOf(':')
  return sep === -1 ? { family: scope } : { family: scope.slice(0, sep), tier: tiers.indexOf(scope.slice(sep + 1)) }
}

const implies = (m: string, s: string) => {
  if (m === s) return true
  const a = split(m)
  const b = split(s)
  if (a.tier === undefined) return b.tier !== undefined && a.family === b.family
  if (a.tier === -1 || b.tier === undefined || b.tier === -1) return false
  return (a.family === b.family || a.family === 'all') && a.tier >= b.tier
}

export const collapseScopes = (scopes: string[]): string[] => {
  const unique = [...new Set(scopes)]
  return unique.filter(s => !unique.some(m => m !== s && implies(m, s)))
}
