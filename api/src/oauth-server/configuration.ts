import type { Configuration, JWK } from 'oidc-provider'
import { randomBytes } from 'node:crypto'
import mongo from '#mongo'
import { jwtDurations } from '#config'
import { defaultLocale, messages } from '#i18n'
import { getKnownScopes } from '../scopes/service.ts'
import { MongoAdapter } from './adapter.ts'
import type { IssuerContext } from './issuers.ts'

const cookieKeysId = 'oauth-server-cookie-keys'

// shared by all replicas and issuers: insert-if-absent so concurrent boots agree on the first writer
export const getCookieKeys = async (): Promise<string[]> => {
  const existing = await mongo.secrets.findOne({ _id: cookieKeysId })
  if (existing) return existing.data
  const keys = [0, 1, 2].map(() => randomBytes(32).toString('base64url'))
  await mongo.secrets.updateOne({ _id: cookieKeysId }, { $setOnInsert: { data: keys } }, { upsert: true })
  return (await mongo.secrets.findOne({ _id: cookieKeysId }))?.data ?? keys
}

export const jwtBearerGrantType = 'urn:ietf:params:oauth:grant-type:jwt-bearer'

export const buildConfiguration = async (ctx: IssuerContext, signingJwk: JWK): Promise<Configuration> => {
  const knownScopes = await getKnownScopes(defaultLocale, messages[defaultLocale].scopes)
  return {
    adapter: MongoAdapter,
    jwks: { keys: [signingJwk] },
    cookies: { keys: await getCookieKeys() },
    features: {
      clientCredentials: { enabled: true },
      resourceIndicators: { enabled: true },
      revocation: { enabled: true },
      devInteractions: { enabled: false },
      introspection: { enabled: false },
      registration: { enabled: false }
    },
    pkce: { required: () => true },
    enabledJWA: {
      clientAuthSigningAlgValues: ['RS256', 'ES256', 'PS256', 'EdDSA']
    },
    routes: {
      token: '/api/oauth/token',
      revocation: '/api/oauth/revoke',
      jwks: '/api/oauth/jwks',
      authorization: '/api/oauth/authorize'
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
  const grantTypes: string[] = body.grant_types_supported ?? []
  if (!grantTypes.includes(jwtBearerGrantType)) grantTypes.push(jwtBearerGrantType)
  body.grant_types_supported = grantTypes
}
