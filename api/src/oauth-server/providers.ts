import Provider, { type JWK } from 'oidc-provider'
import { createPrivateKey } from 'node:crypto'
import { getSignatureKeys } from '../tokens/keys-manager.ts'
import { buildConfiguration, discoveryOverrides } from './configuration.ts'
import type { IssuerContext } from './issuers.ts'

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
