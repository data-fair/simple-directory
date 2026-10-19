// OAuth clients of the authorization server: in M1 the only clients are NHIs, synthesized from the
// NHI record on every lookup (never stored by the adapter).
import type { IncomingMessage } from 'node:http'
import type { ClientMetadata } from 'oidc-provider'
import config from '#config'
import storages from '#storages'
import type { SiteOAuthClient } from '#types'
import { getSite } from '../sites/service.ts'
import { getMainSiteOAuthClients } from '../sites/main-site.ts'
import type { IssuerContext } from './issuers.ts'

// only NHIs with inline jwks are clients: the provider authenticates private_key_jwt against the
// client's jwks metadata. NHIs relying on issuer discovery use the JWT bearer grant only.
export const findNhiClient = async (clientId: string): Promise<ClientMetadata | undefined> => {
  if (!config.manageNhis) return undefined
  const user = await storages.globalStorage.getUser(clientId)
  if (!user?.nhi?.provider?.jwks || user.organizations.length !== 1) return undefined
  return {
    client_id: clientId,
    grant_types: ['client_credentials'],
    response_types: [],
    redirect_uris: [],
    token_endpoint_auth_method: 'private_key_jwt',
    token_endpoint_auth_signing_alg: undefined,
    jwks: user.nhi.provider.jwks as unknown as ClientMetadata['jwks']
  }
}

// the rate limiting keys consumed by the router for a client_credentials request, refunded by the
// provider middleware once the token is issued (before the response is written)
export const clientCredentialsLimits = new WeakMap<IncomingMessage, { clientIp: string, clientId: string | undefined }>()

export type SdClientKind = 'nhi' | 'site' | 'cimd' | 'dcr'

// the kind is derived from the shape of the id and nothing else
export const clientKind = (clientId: string): SdClientKind => {
  if (clientId.startsWith('nhi-')) return 'nhi'
  if (clientId.startsWith('site-')) return 'site'
  if (clientId.startsWith('https://')) return 'cimd'
  return 'dcr'
}

// always a fresh read: removing or shrinking a client must apply on the next request
export const getIssuerSiteClients = async (ctx: IssuerContext): Promise<SiteOAuthClient[]> => {
  if (!ctx.site) return await getMainSiteOAuthClients()
  return (await getSite(ctx.site._id))?.oauthClients ?? []
}

export const findSiteClient = async (ctx: IssuerContext, clientId: string): Promise<SiteOAuthClient | undefined> => {
  if (clientKind(clientId) !== 'site') return undefined
  return (await getIssuerSiteClients(ctx)).find(c => c.id === clientId)
}

export const siteClientMetadata = (client: SiteOAuthClient): ClientMetadata => ({
  client_id: client.id!,
  client_name: client.name,
  logo_uri: client.logoUri,
  redirect_uris: client.redirectUris,
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  token_endpoint_auth_method: 'none',
  application_type: 'web'
})

const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

export const isLoopbackRedirectUri = (uri: string): boolean => {
  try {
    const url = new URL(uri)
    return url.protocol === 'http:' && loopbackHosts.has(url.hostname)
  } catch {
    return false
  }
}

// https (or loopback http for local development), no fragment, no credentials. The provider then
// matches registered redirect uris exactly (no prefix, no wildcard).
export const siteRedirectUriAllowed = (uri: string): boolean => {
  let url: URL
  try { url = new URL(uri) } catch { return false }
  if (url.hash || uri.includes('#') || url.username || url.password) return false
  return url.protocol === 'https:' || isLoopbackRedirectUri(uri)
}

export const siteClientOrigins = (client: SiteOAuthClient): string[] => {
  if (client.allowedOrigins?.length) return client.allowedOrigins
  const origins = new Set<string>()
  for (const uri of client.redirectUris) {
    try { origins.add(new URL(uri).origin) } catch { /* refused at registration */ }
  }
  return [...origins]
}
