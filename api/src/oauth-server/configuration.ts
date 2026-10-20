import { errors, interactionPolicy } from 'oidc-provider'
import type { Configuration, JWK, KoaContextWithOIDC, FindAccount } from 'oidc-provider'
import { randomBytes } from 'node:crypto'
import mongo from '#mongo'
import config, { jwtDurations } from '#config'
import storages from '#storages'
import type { User } from '#types'
import { defaultLocale, messages } from '#i18n'
import { reqIp } from '@data-fair/lib-express'
import { getKnownScopes } from '../scopes/service.ts'
import { grantedScope, narrowScope } from '../nhis/scopes.ts'
import { ipAllowed } from '../nhis/ips.ts'
import { MongoAdapter } from './adapter.ts'
import { allowClient, allowFetch, ssrfFetch } from './dynamic-clients.ts'
import { nanoid } from 'nanoid'
import { findNhiClient, findSiteClient, siteClientMetadata, siteClientOrigins, clientKind, sdClientBasedCORS, siteClientResourceAllowed, siteClientsEnabled, agentClientsEnabled, codeFlowEnabled } from './clients.ts'
import { resolveResource, ResourceError, assertNhiMayTarget } from './issuers.ts'
import type { IssuerContext, ResolvedResource } from './issuers.ts'
import { sdClaims, stripOidcScopes } from './access-token.ts'
import { jwtBearerGrantType } from './jwt-bearer.ts'
import { getGrantRecord, dashboardGrantLifetime } from './grants.ts'
import { oidcScopeNames } from './consent.ts'
import { checkGrantSubject, GrantSubjectError, knownScopeNames } from './grant-subject.ts'
import Debug from 'debug'

const debug = Debug('oauth-server')

const cookieKeysId = 'oauth-server-cookie-keys'

// shared by all replicas and issuers: insert-if-absent so concurrent boots agree on the first writer
export const getCookieKeys = async (): Promise<string[]> => {
  const existing = await mongo.secrets.findOne({ _id: cookieKeysId })
  if (existing) return existing.data
  const keys = [0, 1, 2].map(() => randomBytes(32).toString('base64url'))
  await mongo.secrets.updateOne({ _id: cookieKeysId }, { $setOnInsert: { data: keys } }, { upsert: true })
  return (await mongo.secrets.findOne({ _id: cookieKeysId }))?.data ?? keys
}

// what an SD grant computed for the access token, handed to the JWT customizer through the koa state
export type SdTokenState = { clientId: string, user: User, sub: string, aud: string | string[], scope: string | undefined, claims: Record<string, any>, grantId?: string }

// claims the provider (or the customizer itself) owns, never taken from sdClaims
const reservedClaims = new Set(['iss', 'sub', 'aud', 'exp', 'iat', 'nbf', 'jti', 'client_id', 'scope', 'cnf', 'authorization_details'])
const adminClaims = ['isAdmin', 'adminMode', 'asAdmin']

// the clients are NHIs synthesized from their record, site clients read from the issuer site and
// dynamic clients registered on this issuer (DCR), the other models are stored in mongo. CIMD
// clients are resolved by the provider itself after this lookup (dynamic-clients.ts).
const adapterFactory = (ctx: IssuerContext) => (name: string) => {
  if (name !== 'Client') return new MongoAdapter(name)
  const adapter = new MongoAdapter(name, { issuer: ctx.issuer })
  const findStoredClient = adapter.find.bind(adapter)
  adapter.find = async (id: string) => {
    const nhiClient = await findNhiClient(id)
    if (nhiClient) return nhiClient as any
    const siteClient = await findSiteClient(ctx, id)
    if (siteClient) return { ...siteClientMetadata(siteClient), sd_allowed_origins: siteClientOrigins(siteClient) } as any
    if (!agentClientsEnabled() || clientKind(id) !== 'dcr') return undefined
    return await findStoredClient(id)
  }
  return adapter
}

// client_credentials for an NHI: the same rules as the JWT bearer grant (nhis/exchange.ts), with
// the client already authenticated by the provider (private_key_jwt), so precise errors are fine
const nhiClientCredentials = async (koaCtx: KoaContextWithOIDC, clientId: string, resource: ResolvedResource) => {
  const user = await storages.globalStorage.getUser(clientId)
  if (!user?.nhi?.provider?.jwks || user.organizations.length !== 1) throw new errors.InvalidGrant('unknown nhi')
  // ResourceError, mapped to invalid_target by the caller
  assertNhiMayTarget(user, resource)
  const clientIp = reqIp(koaCtx.req)
  if (user.nhi.allowedIps?.length && !ipAllowed(clientIp, user.nhi.allowedIps)) {
    throw new errors.InvalidGrant(`ip ${clientIp} not in allowedIps`)
  }
  const requested = koaCtx.oidc.params?.scope as string | undefined
  let scope: string | undefined
  try {
    scope = grantedScope(user.nhi.scopes, stripOidcScopes(requested) || undefined)
  } catch (err: any) {
    if (err.status === 400) throw new errors.InvalidScope(err.message.replace(/^invalid_scope: /, ''), requested ?? '')
    throw err
  }
  const boundIp = user.nhi.ipBinding ? clientIp : undefined
  const state: SdTokenState = { clientId, user, sub: user.id, aud: resource.audience, scope, claims: sdClaims(user, resource, { scope, boundIp }) }
  koaCtx.state.sdToken = state
  return scope
}

const requestedPlatformScopes = (scope: unknown) =>
  typeof scope === 'string' ? (stripOidcScopes(scope) ?? '').split(' ').filter(Boolean) : []

// the platform scopes a site client may be granted for an authorization request: the requested
// ones within its registration, or its whole registration when it requested none (spec 8.2)
export const siteClientRequestScopes = (requestedScope: unknown, clientScopes: string[], known: string[]) => {
  const requested = requestedPlatformScopes(requestedScope)
  return narrowScope(requested.length ? requested : clientScopes, clientScopes, known)
}

const accountClaims = (user: User) => async (_use: string, scope: string) => {
  const scopes = scope.split(' ')
  const claims: { sub: string } & Record<string, any> = { sub: user.id }
  // identity claims are for user subjects only
  if (!user.nhi) {
    if (scopes.includes('profile')) claims.name = user.name
    if (scopes.includes('email')) claims.email = user.email
  }
  return claims
}

// the subject of a code or refresh token, re-checked at every issuance (checkGrantSubject). The
// resulting claims go to the JWT customizer through the koa state, as for the machine grants.
const grantSubject = async (ctx: IssuerContext, koaCtx: KoaContextWithOIDC, sub: string, token: { kind?: string, consumed?: unknown, grantId?: string, resource?: string | string[] }) => {
  if (!token.grantId) return undefined
  // a replayed refresh token: the provider revokes the whole grant right after this call and issues
  // nothing, the checks below must not turn the reuse into a plain failure that keeps the grant
  if (token.kind === 'RefreshToken' && token.consumed) {
    koaCtx.state.sdReusedRecord = await getGrantRecord(token.grantId)
    return { accountId: sub, claims: async () => ({ sub }) }
  }
  const record = await getGrantRecord(token.grantId)
  if (!record || record.subject.id !== sub || record.clientId !== koaCtx.oidc.client?.clientId) return undefined
  // the provider only accepts a resource of the grant, the record holds the single one granted
  const resourceParam = koaCtx.oidc.params?.resource ?? token.resource
  if (resourceParam !== undefined && resourceParam !== record.resources[0]) return undefined
  let subject
  try {
    subject = await checkGrantSubject(record, ctx, reqIp(koaCtx.req))
  } catch (err) {
    if (err instanceof GrantSubjectError) {
      debug(`grant ${record._id} of client ${record.clientId} refused: ${err.message}`)
      return undefined
    }
    throw err
  }
  const { user, resource, claims } = subject
  let scope = subject.scope
  // a refresh may ask for less than the grant (the provider refuses more)
  const requested = requestedPlatformScopes(koaCtx.oidc.params?.scope)
  if (requested.length) {
    scope = scope.split(' ').filter(s => requested.includes(s)).join(' ')
    if (!scope) throw new errors.InvalidScope('the requested scope is no longer granted', requested.join(' '))
  }
  claims.scope = scope
  const state: SdTokenState = { clientId: record.clientId, user, sub: user.id, aud: resource.audience, scope, claims, grantId: record._id }
  koaCtx.state.sdToken = state
  return { accountId: user.id, claims: accountClaims(user) }
}

const findAccount = (ctx: IssuerContext): FindAccount => async (koaCtx, sub, token) => {
  // at the authorization request and its resume: the subject chosen by the interaction
  if (!token) {
    const user = await storages.globalStorage.getUser(sub)
    if (!user) return undefined
    return { accountId: user.id, claims: accountClaims(user) }
  }
  return await grantSubject(ctx, koaCtx, sub, token as any)
}

// the authorization code flow of a site client (user subject): API resources of the client's
// registration only, never an MCP server
const siteClientResourceScope = async (ctx: IssuerContext, koaCtx: KoaContextWithOIDC, clientId: string, resource: ResolvedResource) => {
  const siteClient = await findSiteClient(ctx, clientId)
  if (!siteClient) throw new errors.InvalidTarget('unknown client')
  if (resource.kind === 'mcp') throw new errors.InvalidTarget('an mcp resource is reserved to service accounts')
  if (!siteClientResourceAllowed(ctx, siteClient, resource)) throw new errors.InvalidTarget('resource not registered for this client')
  const known = await knownScopeNames()
  const route = koaCtx.oidc?.route
  if (route === 'authorization' || route === 'resume') {
    const scope = siteClientRequestScopes(koaCtx.oidc.params?.scope, siteClient.scopes, known)
    if (!scope.length) throw new errors.InvalidScope('no requested scope is allowed for this client', String(koaCtx.oidc.params?.scope ?? ''))
    return scope.join(' ')
  }
  // token endpoint: the claims are computed by findAccount (grantSubject)
  const sdToken: SdTokenState | undefined = koaCtx.state?.sdToken
  return sdToken?.scope ?? narrowScope(siteClient.scopes, undefined, known).join(' ')
}

// the platform scopes a dynamic client may be granted for an authorization request, before the
// NHI is chosen: the requested ones among the known scopes (the widest NHI maximum), or every
// known scope when it requested none (the consent screen then preselects nothing, spec 8.2). The
// NHI maximum is applied by the consent decision and re-applied at every issuance.
export const dynamicClientRequestScopes = (requestedScope: unknown, known: string[]) => {
  const requested = requestedPlatformScopes(requestedScope)
  return requested.length ? narrowScope(requested, undefined, known) : known
}

// the authorization code flow of a dynamic client (NHI subject, spec 7.3): any resource of the
// realm including the MCP server, the NHI's own targets are checked at consent and issuance
const dynamicClientResourceScope = async (koaCtx: KoaContextWithOIDC) => {
  const known = await knownScopeNames()
  const route = koaCtx.oidc?.route
  if (route === 'authorization' || route === 'resume') {
    const scope = dynamicClientRequestScopes(koaCtx.oidc.params?.scope, known)
    if (!scope.length) throw new errors.InvalidScope('no requested scope is known', String(koaCtx.oidc.params?.scope ?? ''))
    return scope.join(' ')
  }
  // token endpoint: the scope re-narrowed against the NHI by findAccount (grantSubject), the
  // provider itself never issues more than the grant's resource scopes
  const sdToken: SdTokenState | undefined = koaCtx.state?.sdToken
  return sdToken?.scope ?? known.join(' ')
}

export const buildConfiguration = async (ctx: IssuerContext, signingJwk: JWK): Promise<Configuration> => {
  const codeFlow = codeFlowEnabled()
  const agentClients = agentClientsEnabled()
  const knownScopes = await getKnownScopes(defaultLocale, messages[defaultLocale].scopes)
  return {
    adapter: adapterFactory(ctx),
    jwks: { keys: [signingJwk] },
    cookies: { keys: await getCookieKeys() },
    features: {
      clientCredentials: { enabled: true },
      resourceIndicators: {
        enabled: true,
        defaultResource: async () => ctx.siteUrl,
        getResourceServerInfo: async (koaCtx, resourceIndicator, client) => {
          let resource: ResolvedResource
          // the provider filters the requested scopes by this list: the NHI's granted scope, or
          // every known scope for an unrestricted one
          let scope = Object.keys(knownScopes).join(' ')
          try {
            resource = await resolveResource(ctx, resourceIndicator)
            if (koaCtx.oidc?.params?.grant_type === 'client_credentials') {
              scope = await nhiClientCredentials(koaCtx, client.clientId, resource) ?? scope
            } else if (siteClientsEnabled() && clientKind(client.clientId) === 'site') {
              scope = await siteClientResourceScope(ctx, koaCtx, client.clientId, resource)
            } else if (agentClients && ['cimd', 'dcr'].includes(clientKind(client.clientId))) {
              scope = await dynamicClientResourceScope(koaCtx)
            }
          } catch (err) {
            if (err instanceof ResourceError) throw new errors.InvalidTarget(err.message)
            throw err
          }
          return {
            scope,
            // the provider only accepts a string, an mcp resource gets its full audience in the customizer
            audience: Array.isArray(resource.audience) ? resource.audience[0] : resource.audience,
            accessTokenFormat: 'jwt',
            accessTokenTTL: jwtDurations.nhiToken,
            jwt: { sign: { alg: 'RS256', kid: signingJwk.kid } }
          }
        }
      },
      // refresh tokens come with the authorization code flow, revocation with them
      // a client revokes its own tokens only
      revocation: { enabled: codeFlow, allowedPolicy: async (_koaCtx, client, token) => token.clientId === client.clientId },
      // no resource server enforces sender-constrained tokens, they must not be issued
      dPoP: { enabled: false },
      devInteractions: { enabled: false },
      introspection: { enabled: false },
      // open (MCP clients cannot have an initial access token) and rate limited by the router,
      // without management: a registration is final. The router normalizes the body first.
      registration: { enabled: agentClients, initialAccessToken: false, issueRegistrationAccessToken: false, idFactory: () => 'dcr-' + nanoid() },
      // https ids only (checked by the provider), fetched through ssrfFetch
      clientIdMetadataDocument: {
        enabled: agentClients,
        ack: 'draft-02',
        allowFetch: async (koaCtx) => agentClients && await allowFetch(koaCtx),
        allowClient
      },
      // served nowhere by the dispatcher, they must not be advertised
      rpInitiatedLogout: { enabled: false },
      userinfo: { enabled: false },
      pushedAuthorizationRequests: { enabled: false }
    },
    responseTypes: ['code'],
    pkce: { required: () => true },
    // carries the allowed CORS origins of a site client, see adapterFactory
    extraClientMetadata: {
      properties: ['sd_allowed_origins'],
      // reserved to site clients: a dynamic client must not be able to widen its own CORS origins
      validator: (_koaCtx, key, value, metadata) => {
        if (key === 'sd_allowed_origins' && value !== undefined && clientKind(metadata.client_id as string) !== 'site') {
          (metadata as any).invalidate('sd_allowed_origins is reserved to site clients')
        }
      }
    },
    clientBasedCORS: (_koaCtx, origin, client) => sdClientBasedCORS(origin, client as any),
    // NHI clients authenticate with their keys, no client has a secret; the code flow clients are
    // public (PKCE)
    clientAuthMethods: codeFlow ? ['private_key_jwt', 'none'] : ['private_key_jwt'],
    enabledJWA: {
      clientAuthSigningAlgValues: ['RS256', 'ES256', 'PS256', 'EdDSA']
    },
    routes: {
      token: '/api/oauth/token',
      jwks: '/api/oauth/jwks',
      authorization: '/api/oauth/authorize',
      revocation: '/api/oauth/revoke',
      registration: '/api/oauth/register'
    },
    // CIMD documents and the jwks_uri of a registered client
    fetch: ssrfFetch as Configuration['fetch'],
    fetchResponseBodyLimits: { 'client_id metadata document': 5 * 1024, jwks_uri: 64 * 1024, sector_identifier_uri: 64 * 1024 },
    formats: {
      customizers: {
        // the claims of the platform (sdClaims) are computed by the grant that knows the NHI
        // and handed over through the koa state
        jwt: async (koaCtx, token, jwt) => {
          const sdToken: SdTokenState | undefined = (koaCtx as any)?.state?.sdToken
          if (sdToken && sdToken.clientId === (token as any).clientId) {
            for (const [key, value] of Object.entries(sdToken.claims)) {
              if (!reservedClaims.has(key)) jwt.payload[key] = value
            }
            jwt.payload.sub = sdToken.sub
            jwt.payload.aud = sdToken.aud
            if (sdToken.scope === undefined) delete jwt.payload.scope
            else jwt.payload.scope = sdToken.scope
          }
          // an access token never carries an admin role
          for (const key of adminClaims) delete jwt.payload[key]
        }
      }
    },
    scopes: Object.keys(knownScopes),
    ttl: { ClientCredentials: jwtDurations.nhiToken },
    // accounts and interactions come with the authorization code flow
    findAccount: async () => undefined,
    ...(codeFlow ? codeFlowConfiguration(ctx, Object.keys(knownScopes)) : {})
  }
}

const sessionTTL = 10 * 60
export const interactionTTL = 30 * 60
const authorizationCodeTTL = 60
const refreshTokenMaxTTL = 7 * 86400

// the provider keeps no login state of its own: SD's session says who is there, through the
// interaction routes (interaction.ts), on every authorization request
const forcedInteractionPolicy = () => {
  const policy = interactionPolicy.base()
  policy.get('login')!.checks.add(new interactionPolicy.Check('sd_login', 'SD decides who is logged in', (koaCtx) => !koaCtx.oidc.result?.login))
  policy.get('consent')!.checks.add(new interactionPolicy.Check('sd_consent', 'SD records every consent', (koaCtx) => !koaCtx.oidc.result?.consent))
  return policy
}

const codeFlowConfiguration = (ctx: IssuerContext, knownScopes: string[]): Partial<Configuration> => ({
  scopes: [...knownScopes, ...oidcScopeNames],
  claims: { openid: ['sub'], profile: ['name'], email: ['email'] },
  clientDefaults: {
    token_endpoint_auth_method: 'none',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code']
  },
  interactions: {
    policy: forcedInteractionPolicy(),
    // absolute: the _interaction cookie path is the pathname of this url, it must keep the
    // /simple-directory prefix and the site path
    url: async (_koaCtx, interaction) => `${ctx.issuer}/api/oauth/interaction/${interaction.uid}`
  },
  // refresh is the credential of dashboards and agents, offline_access is not required
  // (called for the authorization_code exchange, the refresh_token grant rotates on its own)
  issueRefreshToken: async (_koaCtx, client) => client.grantTypeAllowed('refresh_token'),
  rotateRefreshToken: true,
  expiresWithSession: async () => false,
  // only the grant created by SD at consent, never one remembered by the provider session
  loadExistingGrant: async (koaCtx) => {
    const grantId = koaCtx.oidc.result?.consent?.grantId
    return grantId ? await koaCtx.oidc.provider.Grant.find(grantId) : undefined
  },
  ttl: {
    ClientCredentials: jwtDurations.nhiToken,
    AccessToken: (_koaCtx, token) => token.accountId?.startsWith('nhi-') ? jwtDurations.nhiToken : jwtDurations.idToken,
    AuthorizationCode: authorizationCodeTTL,
    // the fallback, SD sets grant.exp itself at consent
    Grant: dashboardGrantLifetime,
    IdToken: jwtDurations.idToken,
    Interaction: interactionTTL,
    // idles out after 7 days, never outlives its grant
    RefreshToken: (koaCtx) => {
      const grantExp = (koaCtx as KoaContextWithOIDC | undefined)?.oidc?.entities?.Grant?.exp
      if (!grantExp) return refreshTokenMaxTTL
      return Math.max(1, Math.min(refreshTokenMaxTTL, grantExp - Math.floor(Date.now() / 1000)))
    },
    Session: sessionTTL
  },
  // errors that cannot be redirected to the client go to the SPA
  renderError: async (koaCtx, out) => {
    koaCtx.status = 303
    koaCtx.redirect(`${ctx.issuer}/oauth/consent?error=${encodeURIComponent(String(out.error ?? 'server_error'))}`)
  },
  findAccount: findAccount(ctx)
})

// discovery values that the provider computes itself and that configuration cannot override
export const discoveryOverrides = (ctx: IssuerContext, body: Record<string, any>) => {
  body.jwks_uri = ctx.issuer + '/.well-known/scoped-jwks.json'
  let grantTypes: string[] = (body.grant_types_supported ?? []).filter((g: string) => g !== 'implicit')
  if (codeFlowEnabled()) {
    body.response_types_supported = ['code']
    body.authorization_response_iss_parameter_supported = true
    body.token_endpoint_auth_methods_supported = ['none', 'private_key_jwt']
  } else {
    // without the authorization code flow the only grants are client_credentials and jwt-bearer
    delete body.authorization_endpoint
    delete body.response_modes_supported
    delete body.authorization_response_iss_parameter_supported
    body.response_types_supported = []
    grantTypes = grantTypes.filter(g => !['authorization_code', 'implicit', 'refresh_token'].includes(g))
  }
  if (config.manageNhis) {
    if (!grantTypes.includes(jwtBearerGrantType)) grantTypes.push(jwtBearerGrantType)
  } else {
    // both machine grants are for NHIs only
    grantTypes = grantTypes.filter(g => g !== 'client_credentials' && g !== jwtBearerGrantType)
  }
  body.grant_types_supported = grantTypes
}
