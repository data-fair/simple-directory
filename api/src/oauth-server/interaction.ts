// SD's side of the authorization code flow: the interaction entry reads the SD session,
// the consent page (SPA) reads the details and posts the decision. The provider keeps no login
// state of its own, these routes tell it who consented to what (interactionResult).
// Mounted after the session middleware; the dispatcher (router.ts) only lets through the exact
// paths /api/oauth/interaction/<uid> and /api/oauth/interaction/<uid>/details.
import express, { Router, type Request, type Response } from 'express'
import Provider, { errors, type Interaction } from 'oidc-provider'
import storages from '#storages'
import mongo from '#mongo'
import type { User } from '#types'
import { reqI18n } from '#i18n'
import { reqSession, markScopeChecked, httpError, type SessionState } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import limiter, { refundLimiter } from '../utils/limiter.ts'
import { getKnownScopes, knownScopeNames } from '../scopes/service.ts'
import { getMainSiteDoc } from '../sites/service.ts'
import { internalError } from '@data-fair/lib-node/observer.js'
import { listNhis } from '../nhis/service.ts'
import { narrowScope } from '../nhis/scopes.ts'
import type { PostOauthConsentReq } from '#doc/oauth/post-consent-req/index.ts'
import { reqIssuer, resolveResource, nhiMayTarget, ResourceError, type IssuerContext, type ResolvedResource } from './issuers.ts'
import { getProvider } from './providers.ts'
import { clientKind, findSiteClient } from './clients.ts'
import { siteClientRequestScopes, dynamicClientRequestScopes, interactionTTL } from './configuration.ts'
import { dashboardGrantLifetime, grantLifetimes, listGrantRecords, revokeGrant } from './grants.ts'
import { displayIdUrl, logSafeName, findDynamicClient } from './dynamic-clients.ts'
import { reqServerSessionId } from '../tokens/service.ts'
import {
  userConsentAccounts, consentAdminOrgs, refuseConsentUser, implicitConsentAccount, createConsentGrant, findConsentAccount,
  isBroadScope, oidcScopeNames, sameDepartment, membershipAccount, type ConsentAccount, type ConsentGrantOptions
} from './consent.ts'

const router = Router()
export default router

router.use(express.json({ limit: '10kb' }))

// reached only through the dispatcher (router.ts), which serves the exact interaction paths when
// the code flow is on. The session is read here whatever its scopes, a scoped session is refused
// explicitly below.
router.use((req, res, next) => {
  markScopeChecked(req)
  next()
})

type InteractionContext = { ctx: IssuerContext, provider: Provider }

const interactionContext = async (req: Request): Promise<InteractionContext> => {
  const ctx = await reqIssuer(req)
  if (!ctx) throw httpError(404)
  return { ctx, provider: await getProvider(ctx) }
}

const entryUrl = (ctx: IssuerContext, uid: string) => `${ctx.issuer}/api/oauth/interaction/${uid}`
const consentPageUrl = (ctx: IssuerContext, query: string) => `${ctx.issuer}/oauth/consent?${query}`

// the interaction of the _interaction cookie (path scoped to its entry url), only when it is the
// one of the url: unknown, expired and mismatching are all "not found"
const loadInteraction = async (provider: Provider, req: Request, res: Response, uid: string): Promise<Interaction | undefined> => {
  try {
    const interaction = await provider.interactionDetails(req, res)
    return interaction.uid === uid ? interaction : undefined
  } catch (err) {
    if (err instanceof errors.SessionNotFound) return undefined
    throw err
  }
}

// the user who opened the interaction, recorded by the entry
const interactionUserId = (interaction: Interaction): string | undefined => (interaction.result as any)?.sd?.userId

const isFinished = (interaction: Interaction) => !!(interaction.result?.login || interaction.result?.consent || interaction.result?.error)

// The provider session of the interaction belongs to another account (a previous authorization in
// the same browser by someone else): the resume would render the provider's end-session form
// instead of logging in the new subject. The provider session is a technical artefact of a few
// minutes, SD's session is the only source of who is there: drop it and detach the interaction.
const detachForeignSession = async (provider: Provider, interaction: Interaction, accountId: string) => {
  if (!interaction.session || interaction.session.accountId === accountId) return
  const session = interaction.session.uid ? await provider.Session.findByUid(interaction.session.uid) : undefined
  if (session) await session.destroy()
  delete interaction.session
  await interaction.persist()
}

type SessionUser = { session: SessionState, user: User, serverSessionId: string }

// the SD session of the request and its user, or the reason it may not consent
const consentSessionUser = async (req: Request): Promise<SessionUser | { refused: string } | undefined> => {
  const session = reqSession(req)
  if (!session.user) return undefined
  // what the session alone tells (scopes, nhi, org storage), before any user lookup
  const sessionRefusal = refuseConsentUser({ id: session.user.id } as User, session)
  if (sessionRefusal) return { refused: sessionRefusal }
  const user = await storages.globalStorage.getUser(session.user.id)
  if (!user) return { refused: 'unknown user' }
  const refusal = refuseConsentUser(user, session)
  if (refusal) return { refused: refusal }
  // a consent is bound to a live server session (revoked with it): a copied id_token cookie alone
  // must not be enough to authorize a client for weeks
  const serverSessionId = await reqServerSessionId(req, user)
  if (!serverSessionId) return { refused: 'no server session' }
  return { session, user, serverSessionId }
}

// the owner of the issuer site, for the default account and the implicit consent (the main site
// document's owner for the main issuer)
const issuerSiteOwner = async (ctx: IssuerContext) => ctx.site?.owner ?? (await getMainSiteDoc())?.owner

const requestedOidcScopes = (interaction: Interaction) =>
  String(interaction.params.scope ?? '').split(' ').filter(s => oidcScopeNames.includes(s))

type I18n = ReturnType<typeof reqI18n>

// an error of the entry route that goes to the consent page as ?error=<oauthError>
const entryError = (oauthError: string, message: string) => Object.assign(httpError(400, message), { oauthError })

const resourceParam = (interaction: Interaction): string | undefined => {
  const resource = interaction.params.resource
  return typeof resource === 'string' ? resource : undefined
}

const knownScopes = (i18n: I18n) => getKnownScopes(i18n.localeCode, i18n.messages.scopes)

const siteClientScopes = async (interaction: Interaction, clientScopes: string[]) =>
  siteClientRequestScopes(interaction.params.scope, clientScopes, await knownScopeNames())

const resolveInteractionResource = async (ctx: IssuerContext, interaction: Interaction) => {
  const url = resourceParam(interaction)
  if (!url) throw entryError('invalid_target', 'a single resource is required')
  try {
    return { url, resolved: await resolveResource(ctx, url) }
  } catch (err) {
    if (err instanceof ResourceError) throw entryError('invalid_target', err.message)
    throw err
  }
}

// a decision is taken once: the first request inserts the lock of the interaction, any other
// (concurrent or replayed) fails on the duplicate id. A failed decision keeps its lock, the
// interaction is over and the person starts the authorization again. Kept outside the provider's
// interaction document, which the provider rewrites on every save. Lives as long as an interaction may.
const lockDecision = async (uid: string) => {
  try {
    await mongo.oauthInteractionDecisions.insertOne({ _id: uid, expiresAt: new Date(Date.now() + interactionTTL * 1000) })
    return true
  } catch (err: any) {
    if (err.code === 11000) return false
    throw err
  }
}

// the provider Grant of a decision and its record, then the result the provider resumes with; the
// grant does not outlive a failure
const grantAndResume = async (req: Request, res: Response, ic: InteractionContext, interaction: Interaction, opts: Omit<ConsentGrantOptions, 'ctx' | 'interaction' | 'logContext'>) => {
  const grantId = await createConsentGrant(ic.provider, { ...opts, ctx: ic.ctx, interaction, logContext: { req } })
  try {
    return await ic.provider.interactionResult(req, res, { login: { accountId: opts.subject.id }, consent: { grantId } })
  } catch (err) {
    await revokeGrant(grantId, 'consent failed', { req })
      .catch(revokeErr => internalError('oauth-consent-undo', 'failed to revoke the grant of a failed consent decision', revokeErr))
    throw err
  }
}

// a live grant of the same client, user, account, resource, scope and server session (grants follow
// the session that consented, its revocation must reach them), whose provider
// Grant already encountered every scope of the request: the checks of the provider's own consent
// prompt (rs_scopes_missing, op_scopes_missing), so resuming with it cannot prompt again
const reusableGrantId = async (ic: InteractionContext, interaction: Interaction, user: User, serverSessionId: string, account: ConsentAccount, scope: string[], resource: string) => {
  const requested = String(interaction.params.scope ?? '').split(' ').filter(Boolean)
  const requestedPlatform = requested.filter(s => !oidcScopeNames.includes(s))
  // without a platform scope in the request the grant's scopes join the request (createConsentGrant)
  if (!requestedPlatform.length) return undefined
  const records = await listGrantRecords({ subjectId: user.id, clientId: interaction.params.client_id as string })
  for (const record of records) {
    if (record.subject.type !== 'user' || record.sessionId !== serverSessionId || record.resources[0] !== resource || record.scope !== scope.join(' ')) continue
    if (record.account.type !== account.type || record.account.id !== account.id || !sameDepartment(record.account.department, account.department)) continue
    const grant = await ic.provider.Grant.find(record._id)
    if (!grant || grant.accountId !== user.id) continue
    const oidcEncountered = grant.getOIDCScopeEncountered().split(' ')
    const resourceEncountered = grant.getResourceScopeEncountered(resource).split(' ')
    const requestedOidc = requested.filter(s => oidcScopeNames.includes(s))
    if (requestedOidc.every(s => oidcEncountered.includes(s)) && requestedPlatform.every(s => resourceEncountered.includes(s))) return record._id
  }
}

// the consent of a user for a site client, an implicit one reusing a live grant when it can (each
// visit of a dashboard must not pile up grants). Returns undefined when another decision on this
// interaction won the race.
export const finishUserConsent = async (req: Request, res: Response, ic: InteractionContext, interaction: Interaction, user: User, serverSessionId: string, account: ConsentAccount, scope: string[], clientName: string, reuseLiveGrant = false) => {
  const { url, resolved } = await resolveInteractionResource(ic.ctx, interaction)
  await detachForeignSession(ic.provider, interaction, user.id)
  if (!await lockDecision(interaction.uid)) return undefined
  const liveGrantId = reuseLiveGrant ? await reusableGrantId(ic, interaction, user, serverSessionId, account, scope, url) : undefined
  if (liveGrantId) return await ic.provider.interactionResult(req, res, { login: { accountId: user.id }, consent: { grantId: liveGrantId } })
  return await grantAndResume(req, res, ic, interaction, {
    subject: { type: 'user', id: user.id },
    account,
    clientKind: 'site',
    clientName,
    scope,
    oidcScopes: requestedOidcScopes(interaction),
    resource: url,
    resourceKind: resolved.kind,
    lifetime: dashboardGrantLifetime,
    authorizedBy: { id: user.id, name: user.name },
    sessionId: serverSessionId
  })
}

// --- NHI consent of dynamic clients ---

const nhiLifetimes = Object.keys(grantLifetimes) as (keyof typeof grantLifetimes)[]
const defaultNhiLifetime = '30d'

// an NHI subject gets no identity claim: profile and email are rejected on its grant
const nhiOidcScopes = (interaction: Interaction) => requestedOidcScopes(interaction).filter(s => s === 'openid' || s === 'offline_access')

const dynamicClientInfo = async (ic: InteractionContext, interaction: Interaction, user: User, clientId: string, kind: 'cimd' | 'dcr') => {
  const client = await findDynamicClient(ic.provider, clientId, 'user:' + user.id)
  if (!client) throw httpError(400, 'unknown client')
  const redirectUri = (interaction.params.redirect_uri as string | undefined) ?? client.redirectUris?.[0]
  let redirectHost = ''
  try { redirectHost = redirectUri ? new URL(redirectUri).host : '' } catch {}
  // an unverified client: its self-declared name only (no logo), its id url or the fact that it
  // registered itself, and where the code goes
  const info: Record<string, any> = { id: clientId, name: logSafeName(client.clientName), kind, verified: false, redirectHost }
  if (kind === 'cimd') info.idUrl = displayIdUrl(clientId)
  else info.registeredAutomatically = true
  return info
}

// the NHIs of an organization that may be bound to this resource: a target the NHI may reach.
// Names and maximum scopes only.
const bindableNhis = async (orgId: string, resource: ResolvedResource, requested: string[], known: string[]) => {
  const { results } = await listNhis(orgId)
  return results
    .filter(n => nhiMayTarget({ id: orgId, department: n.department }, resource))
    // an NHI that could be granted none of the requested scopes is not a choice
    .filter(n => narrowScope(requested, n.scopes, known).length > 0)
    .map(n => ({ id: n.id, name: n.name, ...(n.scopes ? { scopes: n.scopes } : {}) }))
}

const dynamicClientDetails = async (req: Request, ic: InteractionContext, interaction: Interaction, user: User, clientId: string, kind: 'cimd' | 'dcr') => {
  const client = await dynamicClientInfo(ic, interaction, user, clientId, kind)
  const { url, resolved } = await resolveInteractionResource(ic.ctx, interaction)
  const descriptions = await knownScopes(reqI18n(req))
  // the requested scopes, nothing preselected; each NHI's maximum narrows them on the screen
  const known = Object.keys(descriptions)
  const requested = dynamicClientRequestScopes(interaction.params.scope, known)
  const scopes = requested
    .map(name => ({ name, description: descriptions[name] ?? name, broad: isBroadScope(name) }))
  const organizations = consentAdminOrgs(user).filter(a => nhiMayTarget(a, resolved))
  // keyed by organization id: the NHIs belong to the organization, whatever the department
  const nhis: Record<string, { id: string, name: string, scopes?: string[] }[]> = {}
  for (const account of organizations) {
    nhis[account.id] ??= await bindableNhis(account.id, resolved, requested, known)
  }
  return {
    client,
    resource: { url, kind: resolved.kind },
    scopes,
    oidcScopes: nhiOidcScopes(interaction),
    organizations,
    nhis,
    lifetimes: nhiLifetimes,
    defaultLifetime: defaultNhiLifetime
  }
}

type ConsentDecision = PostOauthConsentReq['body']
// the decision of an org admin for a dynamic client: the account, an NHI of the organization
// (managed on the organization page), the scopes within the request and the NHI maximum, the
// lifetime. Returns the url the browser resumes the authorization with.
const nhiConsentDecision = async (req: Request, res: Response, ic: InteractionContext, interaction: Interaction, user: User, serverSessionId: string, clientId: string, kind: 'cimd' | 'dcr', body: ConsentDecision) => {
  const client = await dynamicClientInfo(ic, interaction, user, clientId, kind)
  const adminAccount = findConsentAccount(consentAdminOrgs(user), body.account)
  if (!adminAccount || adminAccount.type !== 'organization') throw httpError(403, 'account is not an organization administered by the user')
  const lifetime = body.lifetime ?? defaultNhiLifetime
  const { url, resolved } = await resolveInteractionResource(ic.ctx, interaction)

  if (!body.nhi) throw httpError(400, 'nhi is required')
  const nhi = await storages.globalStorage.getUser(body.nhi.id)
  if (!nhi?.nhi || nhi.organizations?.length !== 1 || nhi.organizations[0].id !== adminAccount.id) throw httpError(400, 'unknown nhi')
  if (!nhiMayTarget(nhi.organizations[0], resolved)) throw httpError(400, 'the resource is not reachable by this nhi')

  const known = await knownScopeNames()
  const allowed = narrowScope(dynamicClientRequestScopes(interaction.params.scope, known), nhi.nhi.scopes, known)
  const scope = body.scopes
  if (!scope?.every(s => allowed.includes(s))) {
    throw httpError(400, 'scopes must be a non-empty subset of the requested scopes within the nhi maximum')
  }

  if (!await lockDecision(interaction.uid)) throw httpError(400, 'the interaction is already finished')
  await detachForeignSession(ic.provider, interaction, nhi.id)
  return await grantAndResume(req, res, ic, interaction, {
    subject: { type: 'nhi', id: nhi.id },
    account: membershipAccount(nhi.organizations[0]),
    clientKind: kind,
    clientName: client.name,
    scope: [...new Set(scope)],
    oidcScopes: nhiOidcScopes(interaction),
    resource: url,
    resourceKind: resolved.kind,
    lifetime: grantLifetimes[lifetime],
    authorizedBy: { id: user.id, name: user.name },
    sessionId: serverSessionId
  })
}

router.get('/:uid', async (req, res) => {
  const ic = await interactionContext(req)
  const uid = req.params.uid
  const interaction = await loadInteraction(ic.provider, req, res, uid)
  if (!interaction) return res.redirect(consentPageUrl(ic.ctx, 'error=interaction_expired'))
  // already decided (the consent page was left open, the browser went back): resume
  if (isFinished(interaction)) return res.redirect(303, interaction.returnTo)

  const sessionUser = await consentSessionUser(req)
  if (!sessionUser) return res.redirect(`${ic.ctx.issuer}/login?redirect=${encodeURIComponent(entryUrl(ic.ctx, uid))}`)
  if ('refused' in sessionUser) return res.redirect(consentPageUrl(ic.ctx, 'error=forbidden'))
  const { user, serverSessionId } = sessionUser

  if (Array.isArray(interaction.params.resource)) {
    const returnTo = await ic.provider.interactionResult(req, res, { error: 'invalid_target', error_description: 'only one resource indicator is accepted' }, { mergeWithLastSubmission: false })
    return res.redirect(303, returnTo)
  }

  // the decision routes only accept this user from now on (a later entry by another user rebinds it)
  await ic.provider.interactionResult(req, res, { sd: { userId: user.id } } as any, { mergeWithLastSubmission: false })

  const clientId = interaction.params.client_id as string
  if (clientKind(clientId) === 'site') {
    const siteClient = await findSiteClient(ic.ctx, clientId)
    if (!siteClient) return res.redirect(consentPageUrl(ic.ctx, 'error=invalid_client'))
    const forced = String(interaction.params.prompt ?? '').split(' ').includes('consent')
    const account = !forced && implicitConsentAccount(user, siteClient, await issuerSiteOwner(ic.ctx))
    const scope = await siteClientScopes(interaction, siteClient.scopes)
    if (account && scope.length) {
      const fresh = await loadInteraction(ic.provider, req, res, uid)
      if (!fresh) return res.redirect(consentPageUrl(ic.ctx, 'error=interaction_expired'))
      let returnTo: string | undefined
      try {
        returnTo = await finishUserConsent(req, res, ic, fresh, user, serverSessionId, account, scope, siteClient.name, true)
      } catch (err: any) {
        // the entry is a browser navigation: client errors go to the consent page, never raw
        if (err.status && err.status < 500) return res.redirect(consentPageUrl(ic.ctx, 'error=' + encodeURIComponent(err.oauthError ?? 'invalid_request')))
        throw err
      }
      return res.redirect(303, returnTo ?? fresh.returnTo)
    }
  }
  res.redirect(consentPageUrl(ic.ctx, 'uid=' + encodeURIComponent(uid)))
})

// the interaction for a decision route, with the user who opened it
const decisionContext = async (req: Request, res: Response) => {
  const ic = await interactionContext(req)
  const sessionUser = await consentSessionUser(req)
  if (!sessionUser) throw httpError(401)
  if ('refused' in sessionUser) throw httpError(403, sessionUser.refused)
  const interaction = await loadInteraction(ic.provider, req, res, req.params.uid as string)
  if (!interaction) throw httpError(400, 'interaction_expired')
  // a decided interaction no longer records who opened it: finished first
  if (isFinished(interaction)) throw httpError(400, 'the interaction is already finished')
  if (interactionUserId(interaction) !== sessionUser.user.id) throw httpError(403, 'the interaction was opened by another user')
  return { ic, interaction, ...sessionUser }
}

router.get('/:uid/details', async (req, res) => {
  const { ic, interaction, user } = await decisionContext(req, res)
  const clientId = interaction.params.client_id as string
  const kind = clientKind(clientId)
  if (kind === 'cimd' || kind === 'dcr') return res.send(await dynamicClientDetails(req, ic, interaction, user, clientId, kind))
  if (kind !== 'site') throw httpError(400, 'unknown client')
  const siteClient = await findSiteClient(ic.ctx, clientId)
  if (!siteClient) throw httpError(400, 'unknown client')
  const { url, resolved } = await resolveInteractionResource(ic.ctx, interaction)
  const i18n = reqI18n(req)
  const descriptions = await knownScopes(i18n)
  const scopes = (await siteClientScopes(interaction, siteClient.scopes)).map(name => ({ name, description: descriptions[name] ?? name, broad: isBroadScope(name) }))
  const redirectUri = (interaction.params.redirect_uri as string | undefined) ?? siteClient.redirectUris[0]
  const client: Record<string, any> = { id: clientId, name: siteClient.name, kind, verified: true, redirectHost: new URL(redirectUri).host }
  if (siteClient.logoUri) client.logoUri = siteClient.logoUri
  res.send({
    client,
    resource: { url, kind: resolved.kind },
    scopes,
    oidcScopes: requestedOidcScopes(interaction),
    accounts: userConsentAccounts(user, ic.ctx.site ?? (await getMainSiteDoc()) ?? undefined)
  })
})

router.post('/:uid', async (req, res) => {
  const { ic, interaction, user, serverSessionId } = await decisionContext(req, res)
  const uid = interaction.uid
  const { body } = (await import('#doc/oauth/post-consent-req/index.ts')).returnValid(req, { name: 'req' })
  const limiterKey = 'oauth-consent:' + user.id
  if (!await limiter()(limiterKey)) throw httpError(429, reqI18n(req).messages.errors.rateLimitAuth)

  const clientId = interaction.params.client_id as string
  if (body.decision === 'deny') {
    if (!await lockDecision(uid)) throw httpError(400, 'the interaction is already finished')
    const redirectTo = await ic.provider.interactionResult(req, res, { error: 'access_denied', error_description: 'the end-user denied the request' }, { mergeWithLastSubmission: false })
    eventsLog.info('sd.oauth.consent.denied', `consent denied to oauth client ${clientId}`, { req })
    await refundLimiter(limiterKey)
    return res.send({ redirectTo })
  }

  const kind = clientKind(clientId)
  if (kind === 'cimd' || kind === 'dcr') {
    const redirectTo = await nhiConsentDecision(req, res, ic, interaction, user, serverSessionId, clientId, kind, body)
    await refundLimiter(limiterKey)
    return res.send({ redirectTo })
  }
  if (kind !== 'site') throw httpError(400, 'unknown client')
  const siteClient = await findSiteClient(ic.ctx, clientId)
  if (!siteClient) throw httpError(400, 'unknown client')
  const account = findConsentAccount(userConsentAccounts(user), body.account)
  if (!account) throw httpError(400, 'account is not one of the accounts of the user')
  const allowed = await siteClientScopes(interaction, siteClient.scopes)
  const scope = body.scopes ?? allowed
  if (!scope.every(s => allowed.includes(s))) throw httpError(400, 'scopes must be a non-empty subset of the proposed scopes')
  const redirectTo = await finishUserConsent(req, res, ic, interaction, user, serverSessionId, account, [...new Set(scope)], siteClient.name)
  if (!redirectTo) throw httpError(400, 'the interaction is already finished')
  await refundLimiter(limiterKey)
  res.send({ redirectTo })
})
