import { errors } from 'oidc-provider'
import type { ClientMetadata, Configuration, JWK, KoaContextWithOIDC } from 'oidc-provider'
import { randomBytes } from 'node:crypto'
import mongo from '#mongo'
import config, { jwtDurations } from '#config'
import storages from '#storages'
import type { User } from '#types'
import { defaultLocale, messages } from '#i18n'
import { reqIp } from '@data-fair/lib-express'
import { getKnownScopes } from '../scopes/service.ts'
import { grantedScope } from '../nhis/scopes.ts'
import { ipAllowed } from '../nhis/ips.ts'
import { MongoAdapter } from './adapter.ts'
import { findNhiClient, findSiteClient, siteClientMetadata, siteClientOrigins } from './clients.ts'
import { resolveResource, ResourceError, assertNhiMayTarget } from './issuers.ts'
import type { IssuerContext, ResolvedResource } from './issuers.ts'
import { sdClaims, stripOidcScopes } from './access-token.ts'
import { jwtBearerGrantType } from './jwt-bearer.ts'

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
export type SdTokenState = { clientId: string, user: User, sub: string, aud: string | string[], scope: string | undefined, claims: Record<string, any> }

// claims the provider (or the customizer itself) owns, never taken from sdClaims
const reservedClaims = new Set(['iss', 'sub', 'aud', 'exp', 'iat', 'nbf', 'jti', 'client_id', 'scope', 'cnf', 'authorization_details'])
const adminClaims = ['isAdmin', 'adminMode', 'asAdmin']

// stored dynamic clients (filled by the registration task)
const findStoredClient = async (_ctx: IssuerContext, _clientId: string): Promise<ClientMetadata | undefined> => undefined

// the clients are NHIs synthesized from their record, site clients read from the issuer site and
// stored dynamic clients, the other models are stored in mongo
const adapterFactory = (ctx: IssuerContext) => (name: string) => {
  const adapter = new MongoAdapter(name)
  if (name === 'Client') {
    adapter.find = async (id: string) => {
      const nhiClient = await findNhiClient(id)
      if (nhiClient) return nhiClient as any
      const siteClient = await findSiteClient(ctx, id)
      if (siteClient) return { ...siteClientMetadata(siteClient), sd_allowed_origins: siteClientOrigins(siteClient) } as any
      return await findStoredClient(ctx, id) as any
    }
  }
  return adapter
}

// client_credentials for an NHI: the same rules as the JWT bearer grant (nhis/exchange.ts), with
// the client already authenticated by the provider (private_key_jwt), so precise errors are fine
const nhiClientCredentials = async (koaCtx: KoaContextWithOIDC, clientId: string, resource: ResolvedResource) => {
  const user = await storages.globalStorage.getUser(clientId)
  if (!user?.nhi || user.organizations.length !== 1) throw new errors.InvalidGrant('unknown nhi')
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

export const buildConfiguration = async (ctx: IssuerContext, signingJwk: JWK): Promise<Configuration> => {
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
      // M1 issues stateless JWT access tokens only, nothing to revoke (M2 re-enables it)
      revocation: { enabled: false },
      // no resource server enforces sender-constrained tokens, they must not be issued
      dPoP: { enabled: false },
      devInteractions: { enabled: false },
      introspection: { enabled: false },
      registration: { enabled: false },
      // served nowhere by the dispatcher, they must not be advertised
      rpInitiatedLogout: { enabled: false },
      userinfo: { enabled: false },
      pushedAuthorizationRequests: { enabled: false }
    },
    responseTypes: ['code'],
    pkce: { required: () => true },
    // carries the allowed CORS origins of a site client, see adapterFactory
    extraClientMetadata: { properties: ['sd_allowed_origins'] },
    // site clients name their origins, other kinds keep the provider default (an origin of a
    // registered redirect uri, public clients only)
    clientBasedCORS: (_koaCtx, origin, client) => {
      if (origin === 'null') return false
      const allowed = (client as any)['sd_allowed_origins'] as string[] | undefined
      if (allowed) return allowed.includes(origin)
      return client.clientAuthMethod === 'none' && client.redirectUris.some(uri => URL.parse(uri)?.origin === origin)
    },
    // NHI clients authenticate with their keys, no client has a secret and M1 has no public client
    clientAuthMethods: ['private_key_jwt'],
    enabledJWA: {
      clientAuthSigningAlgValues: ['RS256', 'ES256', 'PS256', 'EdDSA']
    },
    routes: {
      token: '/api/oauth/token',
      jwks: '/api/oauth/jwks',
      authorization: '/api/oauth/authorize'
    },
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
    // accounts and interactions come with the authorization code flow (M2)
    findAccount: async () => undefined
  }
}

// discovery values that the provider computes itself and that configuration cannot override
export const discoveryOverrides = (ctx: IssuerContext, body: Record<string, any>) => {
  body.jwks_uri = ctx.issuer + '/.well-known/scoped-jwks.json'
  let grantTypes: string[] = body.grant_types_supported ?? []
  if (!config.oauthServer?.authorizationCode) {
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
