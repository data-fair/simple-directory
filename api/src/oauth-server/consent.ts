// Consent rules of the authorization code flow: who may consent, to which accounts a grant can be
// bound, and the creation of the provider Grant with its SD record. No Express here.
import type Provider from 'oidc-provider'
import type { Interaction } from 'oidc-provider'
import type { SessionState } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import config from '#config'
import type { Site, User } from '#types'
import { getDefaultUserOrg } from '../tokens/service.ts'
import { saveGrantRecord, revokeGrant, type OAuthGrantRecord } from './grants.ts'
import type { IssuerContext } from './issuers.ts'

export type ConsentAccount = { type: 'user' | 'organization', id: string, department?: string, name: string, departmentName?: string }

export const oidcScopeNames = ['openid', 'profile', 'email', 'offline_access']

// what the consent screen flags: a whole resource family (no action part) or an all:* scope
export const isBroadScope = (scope: string) => !scope.includes(':') || scope.startsWith('all:')

export const sameDepartment = (a: string | undefined, b: string | undefined) => (a || undefined) === (b || undefined)

// the organization account of a membership
export const membershipAccount = (membership: { id: string, name: string, department?: string, departmentName?: string }): ConsentAccount => {
  const account: ConsentAccount = { type: 'organization', id: membership.id, name: membership.name }
  if (membership.department) {
    account.department = membership.department
    if (membership.departmentName) account.departmentName = membership.departmentName
  }
  return account
}

// the personal account (unless ignored) and every membership, the default account of the user on
// the site first (getDefaultUserOrg: owner org of the site, then the user's default org)
export const userConsentAccounts = (user: User, site?: Pick<Site, 'owner'>): ConsentAccount[] => {
  const accounts: ConsentAccount[] = []
  if (!user.ignorePersonalAccount) accounts.push({ type: 'user', id: user.id, name: user.name })
  for (const membership of user.organizations ?? []) {
    if (accounts.some(a => a.type === 'organization' && a.id === membership.id && sameDepartment(a.department, membership.department))) continue
    accounts.push(membershipAccount(membership))
  }
  const defaultOrg = getDefaultUserOrg(user, site as Site | undefined)
  if (defaultOrg) {
    const index = accounts.findIndex(a => a.type === 'organization' && a.id === defaultOrg.id && sameDepartment(a.department, defaultOrg.department))
    if (index > 0) accounts.unshift(...accounts.splice(index, 1))
  }
  return accounts
}

export const findConsentAccount = (accounts: ConsentAccount[], key: { type: string, id: string, department?: string } | undefined) =>
  key && accounts.find(a => a.type === key.type && a.id === key.id && sameDepartment(a.department, key.department))

// the organizations where a user may bind a dynamic client to an NHI. Real org admins
// only: the memberships themselves, never admin mode nor the isSiteAdminOf fallback of the NHI page
// (consent phishing surface); a department admin counts only when depAdminIsOrgAdmin is set, as it
// does for the organization itself (acceptDepAsRoot).
export const consentAdminOrgs = (user: User): ConsentAccount[] => {
  const accounts: ConsentAccount[] = []
  for (const membership of user.organizations ?? []) {
    if (membership.role !== 'admin') continue
    if (membership.department && !config.depAdminIsOrgAdmin) continue
    if (accounts.some(a => a.id === membership.id && sameDepartment(a.department, membership.department))) continue
    accounts.push(membershipAccount(membership))
  }
  return accounts
}

// an NHI or a scoped session never consents, a superadmin impersonating
// a user (asAdmin) never obtains a token in their name (no token through admin mode), and a
// user of an org storage only exists inside that organization's directory
export const refuseConsentUser = (user: User, session: SessionState): string | undefined => {
  if (session.scopes || session.user?.scope !== undefined) return 'scoped session'
  if (session.user?.asAdmin) return 'impersonation session'
  if (user.nhi || session.user?.nhi) return 'non-human identity'
  if (user.orgStorage || session.user?.os) return 'user of an organization storage'
}

export type ConsentGrantOptions = {
  ctx: IssuerContext,
  interaction: Interaction,
  subject: { type: 'user' | 'nhi', id: string },
  account: ConsentAccount,
  clientKind: OAuthGrantRecord['clientKind'],
  clientName: string,
  // the chosen platform scopes
  scope: string[],
  // the OIDC scopes allowed for this subject
  oidcScopes: string[],
  // the resource indicator as the request carries it (the provider matches it verbatim)
  resource: string,
  resourceKind: 'api' | 'mcp',
  // seconds
  lifetime: number,
  authorizedBy: { id: string, name: string },
  // the server session of a user's consent: their grant is revoked with it (an NHI grant is not,
  // it does not act as the admin who authorized it)
  sessionId?: string,
  logContext?: EventLogContext
}

// the provider Grant of a consent and its SD record on the same document
export const createConsentGrant = async (provider: Provider, opts: ConsentGrantOptions): Promise<string> => {
  if (!opts.scope.length) throw new Error('a consent grant needs at least one platform scope')
  // spec anti-goal: a user subject never gets a token for an MCP server
  if (opts.resourceKind === 'mcp' && opts.subject.type !== 'nhi') throw new Error('an mcp resource requires an nhi subject')
  // a site client's grant has a user subject, a dynamic client's grant an NHI subject
  // (checkGrantSubject refuses any other pair at every issuance)
  if ((opts.subject.type === 'nhi') === (opts.clientKind === 'site')) throw new Error('the subject type does not match the client kind')
  const clientId = opts.interaction.params.client_id as string
  // a request without any platform scope (the screen proposed the registration or, for a dynamic
  // client, let the admin pick): the provider only issues the scopes of the request (a request
  // without scope at all ends in access_denied), so the chosen ones join the interaction's request.
  // Persisted only once the grant is saved; a decision that fails ends the interaction anyway.
  const requestedParam = String(opts.interaction.params.scope ?? '').split(' ').filter(Boolean)
  const mergeScope = !opts.scope.some(s => requestedParam.includes(s))
  if (mergeScope) opts.interaction.params.scope = [...requestedParam, ...opts.scope].join(' ')
  const grant = new provider.Grant({ accountId: opts.subject.id, clientId })
  // the consent prompt re-prompts until every requested scope was encountered: each one is
  // either granted or rejected, OIDC scopes as such, platform scopes as resource scopes
  const requested = new Set(String(opts.interaction.params.scope ?? '').split(' ').filter(Boolean))
  for (const scope of opts.scope) requested.add(scope)
  for (const scope of requested) {
    if (oidcScopeNames.includes(scope)) {
      if (opts.oidcScopes.includes(scope)) grant.addOIDCScope(scope)
      else grant.rejectOIDCScope(scope)
    } else if (opts.scope.includes(scope)) {
      grant.addResourceScope(opts.resource, scope)
    } else {
      grant.rejectResourceScope(opts.resource, scope)
    }
  }
  const now = Date.now()
  // Grant.save takes no ttl: the expiry is exp when set
  grant.exp = Math.floor(now / 1000) + opts.lifetime
  let grantId: string | undefined
  try {
    await grant.save()
    grantId = grant.jti
    await saveConsentRecord(opts, grantId, clientId, now, grant.exp)
    if (mergeScope) await opts.interaction.persist()
  } catch (err) {
    if (grantId) await revokeGrant(grantId, 'consent failed').catch(() => {})
    throw err
  }
  eventsLog.info('sd.oauth.grant.created', `oauth grant ${grantId} created for client ${clientId} (${opts.clientName}), ${opts.subject.type} ${opts.subject.id}, scope ${opts.scope.join(' ')}`, opts.logContext ?? {})
  return grantId
}

const saveConsentRecord = async (opts: ConsentGrantOptions, grantId: string, clientId: string, now: number, exp: number) => {
  const account: OAuthGrantRecord['account'] = { type: opts.account.type, id: opts.account.id }
  if (opts.account.department) account.department = opts.account.department
  await saveGrantRecord(grantId, {
    issuer: opts.ctx.issuer,
    ...(opts.ctx.site ? { siteId: opts.ctx.site._id } : {}),
    clientId,
    clientName: opts.clientName,
    clientKind: opts.clientKind,
    subject: opts.subject,
    account,
    scope: opts.scope.join(' '),
    resources: [opts.resource],
    authorizedBy: opts.authorizedBy,
    ...(opts.sessionId ? { sessionId: opts.sessionId } : {}),
    createdAt: new Date(now),
    expiresAt: new Date(exp * 1000)
  })
}
