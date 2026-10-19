import { Router } from 'express'
import config from '#config'
import { reqIsInternal, reqSiteUrl } from '@data-fair/lib-express'
import { reqSite } from '../sites/service.ts'
import { issuerOfSite } from './issuers.ts'
import { getProvider } from './providers.ts'
import type Provider from 'oidc-provider'

const router = Router()
export default router

const callbacks = new WeakMap<Provider, ReturnType<Provider['callback']>>()
const providerCallback = (provider: Provider) => {
  let callback = callbacks.get(provider)
  if (!callback) {
    callback = provider.callback()
    callbacks.set(provider, callback)
  }
  return callback
}

const openidDiscovery = '/.well-known/openid-configuration'
const oauthDiscovery = '/.well-known/oauth-authorization-server'

// canonical form expected by issuerOfSite: origin + path without trailing slash
const canonicalSiteUrl = (siteUrl: string) => {
  const url = new URL(siteUrl)
  return url.origin + url.pathname.replace(/\/+$/, '')
}

router.use(async (req, res, next) => {
  const path = req.path
  if (!path.startsWith('/api/oauth/') && path !== openidDiscovery && path !== oauthDiscovery) return next()
  // internal calls carry no site context, the authorization server is only served publicly
  if (reqIsInternal(req)) return next()
  if (!config.oauthServer?.enabled) return res.status(404).send()
  if (path === '/api/oauth/authorize' && !config.oauthServer?.authorizationCode) return res.status(404).send()

  const ctx = await issuerOfSite(await reqSite(req), canonicalSiteUrl(reqSiteUrl(req)))
  if (!ctx) return res.status(404).send()
  const provider = await getProvider(ctx)

  if (path === oauthDiscovery) req.url = openidDiscovery + req.url.slice(oauthDiscovery.length)
  // the provider derives its mount path from the prefix of originalUrl before url, the site middleware
  // stripped the site path and service prefix from url, rebuild originalUrl from the issuer path so
  // endpoints are always issuer + route (also after the discovery rewrite above)
  req.originalUrl = new URL(ctx.issuer).pathname + req.url
  await providerCallback(provider)(req, res)
})
