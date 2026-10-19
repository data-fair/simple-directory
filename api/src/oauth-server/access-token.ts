import { nanoid } from 'nanoid'
import type { User } from '#types'
import { getTokenPayload, signToken } from '../tokens/service.ts'
import type { ResolvedResource } from './issuers.ts'

const oidcScopes = new Set(['openid', 'profile', 'email', 'offline_access'])

// machine grants have no end user: OIDC identity scopes make no sense and are dropped
// '' means "nothing requested" once they are removed
export const stripOidcScopes = (scope: string | undefined): string | undefined => {
  if (scope === undefined) return undefined
  return scope.split(' ').filter(s => s && !oidcScopes.has(s)).join(' ')
}

export const sdClaims = (user: User, resource: ResolvedResource, opts: { scope?: string, boundIp?: string }): Record<string, any> => {
  const claims: Record<string, any> = { ...getTokenPayload(user, resource.site) }
  // an access token never carries an admin role, whatever the user is
  delete claims.isAdmin
  delete claims.adminMode
  delete claims.asAdmin
  if (opts.scope !== undefined) claims.scope = opts.scope
  if (opts.boundIp !== undefined) claims.boundIp = opts.boundIp
  return claims
}

export const signAccessToken = async (claims: { iss: string, sub: string, aud: string | string[], client_id: string } & Record<string, any>, exp: number): Promise<string> => {
  const payload = { ...claims, jti: nanoid(), iat: Math.floor(Date.now() / 1000) }
  return signToken(payload, exp, undefined, 'at+jwt')
}
