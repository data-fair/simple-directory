// The subject of a code or refresh grant, re-checked at every token issuance: the grant
// record, the user or NHI, the bound membership, the client and the scope as they are now. Any
// failure means invalid_grant; the scope can only narrow.
import storages from '#storages'
import type { User } from '#types'
import { knownScopeNames } from '../scopes/service.ts'
import { narrowScope } from '../nhis/scopes.ts'
import { ipAllowed } from '../nhis/ips.ts'
import { findSiteClient, siteClientResourceAllowed } from './clients.ts'
import { resolveResource, ResourceError, nhiMayTarget } from './issuers.ts'
import type { IssuerContext, ResolvedResource } from './issuers.ts'
import { sdClaims } from './access-token.ts'
import type { OAuthGrantRecord } from './grants.ts'
import { consentAdminOrgs, sameDepartment } from './consent.ts'

// the reason is for the server logs, the client only sees invalid_grant
export class GrantSubjectError extends Error {}

// the platform claims of the grant: the organizations claim holds the bound account only, [] for
// the personal account
const boundAccountClaims = (user: User, record: OAuthGrantRecord, resource: ResolvedResource, scope: string) => {
  const claims = sdClaims(user, resource, { scope })
  if (record.account.type === 'organization') {
    // same strict department match as the consent (findConsentAccount)
    const membership = (claims.organizations as any[] ?? []).find(o => o.id === record.account.id && sameDepartment(o.department, record.account.department))
    if (!membership) throw new GrantSubjectError('the bound membership no longer exists')
    claims.organizations = [membership]
  } else {
    if (user.nhi || record.account.id !== user.id) throw new GrantSubjectError('the bound personal account is not the subject')
    claims.organizations = []
  }
  return claims
}

export type GrantSubject = { user: User, scope: string, resource: ResolvedResource, claims: Record<string, any> }

export const checkGrantSubject = async (record: OAuthGrantRecord, ctx: IssuerContext, clientIp: string): Promise<GrantSubject> => {
  if (record.expiresAt.getTime() <= Date.now()) throw new GrantSubjectError('grant expired')
  if (record.issuer !== ctx.issuer) throw new GrantSubjectError('grant of another issuer')
  // a site client's grant has a user subject, a dynamic client's grant an NHI subject
  const nhiSubject = record.subject.type === 'nhi'
  if (nhiSubject === (record.clientKind === 'site')) throw new GrantSubjectError('subject type does not match the client kind')
  const user = await storages.globalStorage.getUser(record.subject.id)
  if (!user) throw new GrantSubjectError('subject not found')
  if (!!user.nhi !== nhiSubject) throw new GrantSubjectError('subject type changed')
  if (record.resources.length !== 1) throw new GrantSubjectError('a grant has a single resource')

  let resource: ResolvedResource
  try {
    resource = await resolveResource(ctx, record.resources[0])
  } catch (err) {
    if (err instanceof ResourceError) throw new GrantSubjectError(err.message)
    throw err
  }

  let max: string[] | undefined
  if (user.nhi) {
    if (user.organizations.length !== 1) throw new GrantSubjectError('invalid nhi')
    if (record.account.type !== 'organization') throw new GrantSubjectError('an nhi grant is bound to its organization')
    // the token endpoint caller is not the API caller, a bound session would be unusable
    if (user.nhi.ipBinding) throw new GrantSubjectError('an ip bound nhi cannot hold an oauth grant')
    if (user.nhi.allowedIps?.length && !ipAllowed(clientIp, user.nhi.allowedIps)) {
      throw new GrantSubjectError(`ip ${clientIp} not in allowedIps`)
    }
    if (!nhiMayTarget(user.organizations[0], resource)) throw new GrantSubjectError('site not owned by the nhi organization')
    max = user.nhi.scopes
  } else {
    // spec anti-goal: no user-subject token for an MCP server
    if (resource.kind === 'mcp') throw new GrantSubjectError('an mcp resource requires an nhi subject')
    const siteClient = await findSiteClient(ctx, record.clientId)
    if (!siteClient) throw new GrantSubjectError('the site client no longer exists')
    if (!siteClientResourceAllowed(ctx, siteClient, resource)) throw new GrantSubjectError('resource no longer registered for this client')
    max = siteClient.scopes
  }

  const scope = narrowScope(record.scope.split(' '), max, await knownScopeNames()).join(' ')
  if (!scope) throw new GrantSubjectError('no scope left')
  const claims = boundAccountClaims(user, record, resource, scope)
  if (user.nhi) {
    // the admin who bound the client to the NHI must still be one (same rule as the consent): a
    // demoted, removed or deleted admin must not keep an agent acting for the organization
    const authorizer = await storages.globalStorage.getUser(record.authorizedBy.id)
    if (!authorizer || !consentAdminOrgs(authorizer).some(a => a.id === record.account.id)) {
      throw new GrantSubjectError('the authorizer is no longer an admin of the organization')
    }
  }
  return { user, scope, resource, claims }
}
