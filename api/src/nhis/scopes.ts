import { httpError, scopeRegexp, scopeCovers } from '@data-fair/lib-express'

// only scopes listed by the platform (or by simple-directory itself) can be stored on an NHI
export const checkScopes = (scopes: string[], known: Record<string, string>) => {
  for (const scope of scopes) {
    if (!scopeRegexp.test(scope)) throw httpError(400, `invalid scope "${scope}"`)
    if (!Object.hasOwn(known, scope)) throw httpError(400, `unknown scope "${scope}"`)
  }
}

// The scope claim of a session issued by the token exchange, undefined for an unrestricted one.
// An NHI without maximum scopes keeps its pre-scopes behavior: unrestricted unless it asks for
// less. Requested scopes must each be covered by the maximum (exact or bare-resource umbrella).
export const grantedScope = (maxScopes: string[] | undefined, requested: string | undefined): string | undefined => {
  const requestedList = requested?.split(' ').filter(s => !!s)
  if (!requestedList?.length) return maxScopes?.join(' ')
  for (const scope of requestedList) {
    if (!scopeRegexp.test(scope)) throw httpError(400, `invalid_scope: "${scope}" is not a valid scope`)
    if (maxScopes && !scopeCovers(maxScopes, scope)) throw httpError(400, `invalid_scope: "${scope}" exceeds the scopes of this identity`)
  }
  return requestedList.join(' ')
}
