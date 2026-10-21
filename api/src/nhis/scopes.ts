import { httpError, scopeRegexp, scopeCovers } from '@data-fair/lib-express'
import { scopeTiers, type ScopeTier } from '@data-fair/lib-common-types/scopes.js'

// only scopes listed by the platform (or by simple-directory itself) can be newly stored on an NHI;
// a scope already stored (the platform may have dropped it since) can be kept, never added back
export const checkScopes = (scopes: string[], known: Record<string, string>, alreadyStored: string[] = []) => {
  for (const scope of scopes) {
    if (!scopeRegexp.test(scope)) throw httpError(400, `invalid scope "${scope}"`)
    if (!alreadyStored.includes(scope) && !Object.hasOwn(known, scope)) throw httpError(400, `unknown scope "${scope}"`)
  }
}

// Does a maximum (NHI scopes, site client registration) cover a scope? On top of the exact or
// bare umbrella match of scopeCovers, a global tier scope covers the tiers at or below its own,
// of the global scopes and of every family (all:write covers all:read, datasets:write and
// datasets:read), as the enforcing services accept it (acceptedScopes). A bare family umbrella
// is never covered by a global tier scope.
const tierIndex = (tier: string) => scopeTiers.indexOf(tier as ScopeTier)
export const maxCovers = (max: string[], scope: string): boolean => {
  if (scopeCovers(max, scope)) return true
  const sep = scope.indexOf(':')
  if (sep === -1) return false
  const tier = tierIndex(scope.slice(sep + 1))
  if (tier === -1) return false
  return max.some(m => m.startsWith('all:') && tierIndex(m.slice(4)) >= tier)
}

// The scope claim of a session issued by the token exchange, undefined for an unrestricted one.
// An NHI without maximum scopes keeps its pre-scopes behavior: unrestricted unless it asks for
// less. Requested scopes must each be covered by the maximum (maxCovers).
export const grantedScope = (maxScopes: string[] | undefined, requested: string | undefined): string | undefined => {
  const requestedList = requested?.split(' ').filter(s => !!s)
  if (!requestedList?.length) return maxScopes?.join(' ')
  for (const scope of requestedList) {
    if (!scopeRegexp.test(scope)) throw httpError(400, `invalid_scope: "${scope}" is not a valid scope`)
    if (maxScopes && !maxCovers(maxScopes, scope)) throw httpError(400, `invalid_scope: "${scope}" exceeds the scopes of this identity`)
  }
  return requestedList.join(' ')
}

// The scopes of an OAuth grant: the requested scopes covered by the maximum (undefined = every
// known scope), in request order and deduplicated. Unlike grantedScope, a scope beyond the maximum
// is dropped silently: the client asked, the consent screen only offers what may be granted.
// Without a maximum the known list is matched as names (the tiers of all:admin would let any
// unknown family through).
export const narrowScope = (requested: string[], max: string[] | undefined, known: string[]): string[] => {
  const narrowed: string[] = []
  for (const scope of requested) {
    if (!scope || narrowed.includes(scope) || !scopeRegexp.test(scope)) continue
    if (max ? maxCovers(max, scope) : scopeCovers(known, scope)) narrowed.push(scope)
  }
  return narrowed
}
