import Provider, { type JWK, type KoaContextWithOIDC } from 'oidc-provider'
import { createPrivateKey } from 'node:crypto'
import config from '#config'
import { getSignatureKeys } from '../tokens/keys-manager.ts'
import { buildConfiguration, discoveryOverrides, type SdTokenState } from './configuration.ts'
import type { IssuerContext } from './issuers.ts'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { refundNhiLimits, updateNhiLogged } from '../nhis/exchange.ts'
import { tokenLimits } from './clients.ts'
import { revokeGrantRecord, touchGrantRecord, type OAuthGrantRecord } from './grants.ts'
import { internalError } from '@data-fair/lib-node/observer.js'
import { logSafeName } from './dynamic-clients.ts'

type CachedProvider = { marker: string, promise: Promise<Provider> }

// one provider per issuer, rebuilt when the scoped signing key rotates, when the issuer context
// changes or when a flag changes: the provider's hooks read ctx (site, siteUrl) through closures and
// the flags shape its configuration, a stale one must not survive
const providers = new Map<string, CachedProvider>()

const cacheMarker = (ctx: IssuerContext, kid: string) =>
  JSON.stringify([kid, ctx.siteUrl, ctx.site?._id ?? null, ctx.site?.updatedAt ?? null,
    !!config.oauthServer?.authorizationCode, !!config.oauthServer?.dynamicClients])

const signingJwk = (privateKeyPem: string, kid: string): JWK => ({
  ...createPrivateKey(privateKeyPem).export({ format: 'jwk' }),
  kid,
  alg: 'RS256',
  use: 'sig'
}) as JWK

const buildProvider = async (ctx: IssuerContext, privateKeyPem: string, kid: string) => {
  const provider = new Provider(ctx.issuer, await buildConfiguration(ctx, signingJwk(privateKeyPem, kid)))
  // behind the reverse proxy, origin and protocol come from x-forwarded-* headers
  provider.proxy = true
  provider.use(async (koaCtx, next) => {
    await next()
    // work started by the provider events of this request, finished before the response is written
    const pending: Promise<unknown>[] | undefined = koaCtx.state.sdPending
    if (pending) await Promise.all(pending)
    if (koaCtx.oidc?.route === 'discovery' && koaCtx.status === 200 && koaCtx.body) {
      discoveryOverrides(ctx, koaCtx.body as Record<string, any>)
    }
    // the provider reports the requested scope, an SD grant may have granted a different one
    // (the NHI's maximum when nothing was requested): the response must match the token
    const sdToken: SdTokenState | undefined = koaCtx.state.sdToken
    if (koaCtx.oidc?.route === 'token' && koaCtx.status === 200 && sdToken && koaCtx.body) {
      const body = koaCtx.body as Record<string, any>
      if (sdToken.scope === undefined) delete body.scope
      else body.scope = sdToken.scope
      // awaited here, before koa writes the response, so the client's next attempt sees the refund
      const limits = tokenLimits.get(koaCtx.req)
      if (limits) await refundNhiLimits(limits.clientIp, limits.clientId)
      if (koaCtx.oidc.params?.grant_type !== 'client_credentials') {
        if (sdToken.grantId) await touchGrantRecord(sdToken.grantId)
        return
      }
      updateNhiLogged(sdToken.user)
      eventsLog.info('sd.auth.nhi.ok', `an NHI access token was issued for ${sdToken.user.id} by the client_credentials grant`, { req: koaCtx.req as any })
    }
  })
  // every failure of the token endpoint (client authentication included), the reason server side only
  provider.on('grant.error', (koaCtx: KoaContextWithOIDC, err: any) => {
    // the provider destroyed the whole grant (grant.revoked follows), a refresh token was replayed
    if (err.error_detail === 'refresh token already used') {
      // read by findAccount before the provider deleted it
      const record: OAuthGrantRecord | undefined = koaCtx.state?.sdReusedRecord
      const grantId = record?._id ?? koaCtx.oidc?.entities?.RefreshToken?.grantId
      const details = record
        ? `client ${record.clientId} (${record.clientName}), ${record.subject.type} ${record.subject.id}, account ${record.account.type} ${record.account.id}${record.account.department ? ' / ' + record.account.department : ''}, authorized by ${record.authorizedBy.name} (${record.authorizedBy.id})`
        : `client ${koaCtx.oidc?.client?.clientId}, subject ${koaCtx.oidc?.entities?.RefreshToken?.accountId}`
      eventsLog.warn('sd.oauth.grant.reused', `refresh token reused for grant ${grantId} of ${details}, the grant is revoked`, { req: koaCtx.req as any })
      return
    }
    if (koaCtx.oidc?.params?.grant_type !== 'client_credentials' || !tokenLimits.has(koaCtx.req)) return
    const clientId = tokenLimits.get(koaCtx.req)?.clientId ?? 'unknown client'
    const reason = [err.error, err.error_description, err.error_detail].filter(Boolean).join(': ')
    eventsLog.warn('sd.auth.nhi.fail', `nhi client_credentials grant failed for ${clientId}: ${reason}`, { req: koaCtx.req as any })
  })
  // refresh token reuse, authorization code reuse and the revocation endpoint: the provider already
  // destroyed its own documents of the grant, only the SD record is left
  provider.on('grant.revoked', (koaCtx: KoaContextWithOIDC, grantId: string) => {
    const pending = revokeGrantRecord(grantId, 'provider', { req: koaCtx?.req as any })
      .catch(err => internalError('oauth-grant-revoked', 'failed to delete the record of a revoked oauth grant', err))
    if (koaCtx?.state) (koaCtx.state.sdPending ??= []).push(pending)
  })
  provider.on('registration_create.success', (koaCtx, client) => {
    const hosts = [...new Set((client.redirectUris ?? []).map(uri => URL.parse(uri)?.host || logSafeName(uri)))].join(', ')
    eventsLog.info('sd.oauth.client.registered', `dynamic oauth client ${client.clientId} (${logSafeName(client.clientName)}) registered on ${ctx.issuer}, redirect hosts ${hosts}`, { req: koaCtx.req as any })
  })
  return provider
}

export const getProvider = async (ctx: IssuerContext): Promise<Provider> => {
  const keys = await getSignatureKeys('scoped')
  const kid = keys.webKeys[0].kid
  const marker = cacheMarker(ctx, kid)
  let cached = providers.get(ctx.issuer)
  if (!cached || cached.marker !== marker) {
    cached = { marker, promise: buildProvider(ctx, keys.privateKey, kid) }
    providers.set(ctx.issuer, cached)
    // a failed build must not stay cached
    cached.promise.catch(() => { if (providers.get(ctx.issuer) === cached) providers.delete(ctx.issuer) })
  }
  return cached.promise
}
