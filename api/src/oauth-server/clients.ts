// OAuth clients of the authorization server: NHIs (synthesized from the NHI record on every lookup),
// site clients (read from the issuer site document) and agent clients (CIMD and DCR, dynamic-clients.ts).
// The adapter's own Client collection only holds the DCR ones.
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

export type SdClientKind = 'nhi' | 'site' | 'cimd' | 'dcr'

// The two kinds of clients of the authorization code flow, each behind its own flag: site clients
// (dashboards registered in the site settings, acting for a user) and agent clients (unregistered,
// CIMD or DCR, acting as an NHI). The flow itself (authorization, consent, refresh, revocation) is
// served when either is on.
export const siteClientsEnabled = () => !!config.oauthServer?.siteClients
export const agentClientsEnabled = () => !!config.oauthServer?.agentClients
export const codeFlowEnabled = () => siteClientsEnabled() || agentClientsEnabled()

// the kind is derived from the shape of the id and nothing else
export const clientKind = (clientId: string): SdClientKind => {
  if (clientId.startsWith('nhi-')) return 'nhi'
  if (clientId.startsWith('site-')) return 'site'
  if (clientId.startsWith('https://')) return 'cimd'
  // registered clients get a dcr- prefix (configuration idFactory); any other id is treated as one
  // too, the most restricted kind
  return 'dcr'
}

// no cache of our own: a site document is read on every call, the main site document goes through
// the 2 s memoization of getMainSiteDoc, so a removal applies on the next request or within 2 s
export const getIssuerSiteClients = async (ctx: IssuerContext): Promise<SiteOAuthClient[]> => {
  if (!ctx.site) return await getMainSiteOAuthClients()
  return (await getSite(ctx.site._id))?.oauthClients ?? []
}

export const findSiteClient = async (ctx: IssuerContext, clientId: string): Promise<SiteOAuthClient | undefined> => {
  if (clientKind(clientId) !== 'site' || !siteClientsEnabled()) return undefined
  return (await getIssuerSiteClients(ctx)).find(c => c.id === clientId)
}

// the API resources of a site client: its registered resources, the issuer site by default
export const siteClientResourceAllowed = (ctx: IssuerContext, client: SiteOAuthClient, resource: { siteUrl: string }) => {
  const allowed = (client.resources?.length ? client.resources : [ctx.siteUrl]).map(r => r.replace(/\/+$/, ''))
  return allowed.includes(resource.siteUrl)
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

export const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

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

// only a site client may name its CORS origins (sd_allowed_origins), whatever other kinds carry;
// the others keep the provider default (an origin of a registered redirect uri, public clients only)
export const sdClientBasedCORS = (origin: string, client: { clientId: string, clientAuthMethod?: string, redirectUris?: string[] } & Record<string, any>): boolean => {
  if (origin === 'null') return false
  if (clientKind(client.clientId) === 'site') {
    const allowed = client.sd_allowed_origins as string[] | undefined
    return !!allowed?.includes(origin)
  }
  return client.clientAuthMethod === 'none' && !!client.redirectUris?.some(uri => URL.parse(uri)?.origin === origin)
}
