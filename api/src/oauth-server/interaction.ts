// SD's side of the authorization code flow (spec 9.1): the interaction entry reads the SD session,
// the consent page (SPA) reads the details and posts the decision. The provider keeps no login
// state of its own, these routes tell it who consented to what (interactionResult).
// Mounted after the session middleware; the dispatcher (router.ts) only lets through the exact
// paths /api/oauth/interaction/<uid> and /api/oauth/interaction/<uid>/details.
import express, { Router, type Request, type Response } from 'express'
import Provider, { errors, type Interaction } from 'oidc-provider'
import config from '#config'
import storages from '#storages'
import mongo from '#mongo'
import type { User } from '#types'
import { reqI18n } from '#i18n'
import { reqSession, reqSiteUrl, markScopeChecked, httpError, type SessionState } from '@data-fair/lib-express'
import eventsLog from '@data-fair/lib-express/events-log.js'
import limiter, { refundLimiter } from '../utils/limiter.ts'
import { getKnownScopes } from '../scopes/service.ts'
import { reqSite, getMainSiteDoc } from '../sites/service.ts'
import { issuerOfSite, resolveResource, ResourceError, type IssuerContext } from './issuers.ts'
import { getProvider } from './providers.ts'
import { canonicalSiteUrl } from './router.ts'
import { clientKind, findSiteClient } from './clients.ts'
import { siteClientRequestScopes } from './configuration.ts'
import { dashboardGrantLifetime } from './grants.ts'
import {
  userConsentAccounts, refuseConsentUser, implicitConsentAccount, createConsentGrant, findConsentAccount,
  isBroadScope, oidcScopeNames, type ConsentAccount
} from './consent.ts'

const router = Router()
export default router

router.use(express.json({ limit: '10kb' }))

// the flags are also checked by the dispatcher, this router must not serve anything without them
router.use((req, res, next) => {
  if (!config.oauthServer?.enabled || !config.oauthServer.authorizationCode) return res.status(404).send()
  // the session is read here whatever its scopes, a scoped session is refused explicitly below
  markScopeChecked(req)
  next()
})

type InteractionContext = { ctx: IssuerContext, provider: Provider }

const interactionContext = async (req: Request): Promise<InteractionContext> => {
  const ctx = await issuerOfSite(await reqSite(req), canonicalSiteUrl(reqSiteUrl(req)))
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

type SessionUser = { session: SessionState, user: User }

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
  return { session, user }
}

// the owner of the issuer site, for the default account and the implicit consent (the main site
// document's owner for the main issuer)
const issuerSiteOwner = async (ctx: IssuerContext) => ctx.site?.owner ?? (await getMainSiteDoc())?.owner

const requestedOidcScopes = (interaction: Interaction) =>
  String(interaction.params.scope ?? '').split(' ').filter(s => oidcScopeNames.includes(s))

type I18n = ReturnType<typeof reqI18n>

const resourceParam = (interaction: Interaction): string | undefined => {
  const resource = interaction.params.resource
  return typeof resource === 'string' ? resource : undefined
}

const knownScopes = (i18n: I18n) => getKnownScopes(i18n.localeCode, i18n.messages.scopes)

const siteClientScopes = async (i18n: I18n, interaction: Interaction, clientScopes: string[]) =>
  siteClientRequestScopes(interaction.params.scope, clientScopes, Object.keys(await knownScopes(i18n)))

const interactionResource = async (ctx: IssuerContext, interaction: Interaction) => {
  const url = resourceParam(interaction)
  if (!url) throw httpError(400, 'a single resource is required')
  try {
    return { url, kind: (await resolveResource(ctx, url)).kind }
  } catch (err) {
    if (err instanceof ResourceError) throw httpError(400, err.message)
    throw err
  }
}

// a decision is taken once: concurrent requests on the same interaction race for this lock, the
// winner's interactionResult then marks the interaction as finished (result.login or result.error)
// and the lock is not needed anymore. Nothing may rewrite the interaction between the lock and
// interactionResult.
const lockDecision = async (uid: string) => {
  const result = await mongo.db.collection<any>('oauth-interaction').updateOne(
    { _id: uid, sdDecision: { $exists: false }, 'payload.result.login': { $exists: false }, 'payload.result.error': { $exists: false } },
    { $set: { sdDecision: new Date() } }
  )
  return result.modifiedCount === 1
}
const unlockDecision = async (uid: string) => {
  await mongo.db.collection<any>('oauth-interaction').updateOne({ _id: uid }, { $unset: { sdDecision: 1 } })
}

// the consent of a user for a site client: the provider Grant and its record, then the result the
// provider resumes with. Returns undefined when another decision on this interaction won the race.
const finishUserConsent = async (req: Request, res: Response, ic: InteractionContext, interaction: Interaction, user: User, account: ConsentAccount, scope: string[], clientName: string) => {
  const resource = await interactionResource(ic.ctx, interaction)
  await detachForeignSession(ic.provider, interaction, user.id)
  if (!await lockDecision(interaction.uid)) return undefined
  try {
    return await createUserGrant(req, res, ic, interaction, user, account, scope, clientName, resource)
  } catch (err) {
    await unlockDecision(interaction.uid)
    throw err
  }
}

const createUserGrant = async (req: Request, res: Response, ic: InteractionContext, interaction: Interaction, user: User, account: ConsentAccount, scope: string[], clientName: string, resource: { url: string, kind: 'api' | 'mcp' }) => {
  const grantId = await createConsentGrant(ic.provider, {
    ctx: ic.ctx,
    interaction,
    subject: { type: 'user', id: user.id },
    account,
    clientKind: 'site',
    clientName,
    scope,
    oidcScopes: requestedOidcScopes(interaction),
    resource: resource.url,
    resourceKind: resource.kind,
    lifetime: dashboardGrantLifetime,
    authorizedBy: { id: user.id, name: user.name },
    logContext: { req }
  })
  return await ic.provider.interactionResult(req, res, { login: { accountId: user.id }, consent: { grantId } })
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
  const { user } = sessionUser

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
    const scope = await siteClientScopes(reqI18n(req), interaction, siteClient.scopes)
    if (account && scope.length) {
      const fresh = await loadInteraction(ic.provider, req, res, uid)
      if (!fresh) return res.redirect(consentPageUrl(ic.ctx, 'error=interaction_expired'))
      const returnTo = await finishUserConsent(req, res, ic, fresh, user, account, scope, siteClient.name)
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
  // dynamic clients (NHI consent) come later
  if (kind !== 'site') throw httpError(501, 'consent for this kind of client is not available')
  const siteClient = await findSiteClient(ic.ctx, clientId)
  if (!siteClient) throw httpError(400, 'unknown client')
  const resource = await interactionResource(ic.ctx, interaction)
  const i18n = reqI18n(req)
  const descriptions = await knownScopes(i18n)
  const scopes = (await siteClientScopes(i18n, interaction, siteClient.scopes)).map(name => ({ name, description: descriptions[name] ?? name, broad: isBroadScope(name) }))
  const redirectUri = (interaction.params.redirect_uri as string | undefined) ?? siteClient.redirectUris[0]
  const client: Record<string, any> = { id: clientId, name: siteClient.name, kind, verified: true, redirectHost: new URL(redirectUri).host }
  if (siteClient.logoUri) client.logoUri = siteClient.logoUri
  res.send({
    client,
    resource,
    scopes,
    oidcScopes: requestedOidcScopes(interaction),
    accounts: userConsentAccounts(user, ic.ctx.site ?? (await getMainSiteDoc()) ?? undefined)
  })
})

router.post('/:uid', async (req, res) => {
  const { ic, interaction, user } = await decisionContext(req, res)
  const uid = interaction.uid
  const body = req.body ?? {}
  if (body.decision !== 'allow' && body.decision !== 'deny') throw httpError(400, 'decision must be allow or deny')
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

  if (clientKind(clientId) !== 'site') throw httpError(501, 'consent for this kind of client is not available')
  const siteClient = await findSiteClient(ic.ctx, clientId)
  if (!siteClient) throw httpError(400, 'unknown client')
  const account = findConsentAccount(userConsentAccounts(user), body.account)
  if (!account) throw httpError(400, 'account is not one of the accounts of the user')
  const allowed = await siteClientScopes(reqI18n(req), interaction, siteClient.scopes)
  const scope = body.scopes ?? allowed
  if (!Array.isArray(scope) || !scope.length || scope.some((s: unknown) => typeof s !== 'string' || !allowed.includes(s))) {
    throw httpError(400, 'scopes must be a non-empty subset of the proposed scopes')
  }
  const redirectTo = await finishUserConsent(req, res, ic, interaction, user, account, [...new Set(scope as string[])], siteClient.name)
  if (!redirectTo) throw httpError(400, 'the interaction is already finished')
  await refundLimiter(limiterKey)
  res.send({ redirectTo })
})
