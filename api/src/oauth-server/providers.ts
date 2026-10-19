import Provider, { type JWK, type KoaContextWithOIDC } from 'oidc-provider'
import { createPrivateKey } from 'node:crypto'
import { getSignatureKeys } from '../tokens/keys-manager.ts'
import { buildConfiguration, discoveryOverrides, type SdTokenState } from './configuration.ts'
import type { IssuerContext } from './issuers.ts'
import eventsLog from '@data-fair/lib-express/events-log.js'
import { refundNhiLimits, updateNhiLogged } from '../nhis/exchange.ts'
import { clientCredentialsLimits } from './clients.ts'

type CachedProvider = { marker: string, promise: Promise<Provider> }

// one provider per issuer, rebuilt when the scoped signing key rotates or when the issuer context
// changes: the provider's hooks read ctx (site, siteUrl) through closures, a stale one must not survive
const providers = new Map<string, CachedProvider>()

const cacheMarker = (ctx: IssuerContext, kid: string) =>
  JSON.stringify([kid, ctx.siteUrl, ctx.site?._id ?? null, ctx.site?.updatedAt ?? null])

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
      const limits = clientCredentialsLimits.get(koaCtx.req)
      if (limits) await refundNhiLimits(limits.clientIp, limits.clientId)
      updateNhiLogged(sdToken.user)
      eventsLog.info('sd.auth.nhi.ok', `an NHI access token was issued for ${sdToken.user.id} by the client_credentials grant`, { req: koaCtx.req as any })
    }
  })
  // every failure of the token endpoint (client authentication included), the reason server side only
  provider.on('grant.error', (koaCtx: KoaContextWithOIDC, err: any) => {
    if (!clientCredentialsLimits.has(koaCtx.req)) return
    const clientId = clientCredentialsLimits.get(koaCtx.req)?.clientId ?? 'unknown client'
    const reason = [err.error, err.error_description, err.error_detail].filter(Boolean).join(': ')
    eventsLog.warn('sd.auth.nhi.fail', `nhi client_credentials grant failed for ${clientId}: ${reason}`, { req: koaCtx.req as any })
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
