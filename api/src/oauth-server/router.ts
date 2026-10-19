import express, { Router } from 'express'
import config from '#config'
import { reqIsInternal, reqSiteUrl } from '@data-fair/lib-express'
import { reqSite } from '../sites/service.ts'
import { issuerOfSite } from './issuers.ts'
import { getProvider } from './providers.ts'
import { handleJwtBearerGrant, jwtBearerGrantType } from './jwt-bearer.ts'
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

// the provider accepts an already parsed body, so the token endpoint is parsed once here
const tokenBodyParser = express.urlencoded({ limit: '56kb', extended: false })

const openidDiscovery = '/.well-known/openid-configuration'
const oauthDiscovery = '/.well-known/oauth-authorization-server'

// the provider derives its mount path from the prefix of originalUrl in front of url, the site
// middleware stripped the site path and service prefix from url: rebuild originalUrl from the issuer
// path so endpoints are always issuer + route (also after the discovery rewrite)
export const providerOriginalUrl = (issuer: string, url: string) => new URL(issuer).pathname.replace(/\/+$/, '') + url

// canonical form expected by issuerOfSite: origin + path without trailing slash
const canonicalSiteUrl = (siteUrl: string) => {
  const url = new URL(siteUrl)
  return url.origin + url.pathname.replace(/\/+$/, '')
}

router.use(async (req, res, next) => {
  const path = req.path
  if (!path.startsWith('/api/oauth/') && path !== openidDiscovery && path !== oauthDiscovery) return next()
  // internal calls carry no site context, the authorization server is only served publicly
  if (reqIsInternal(req)) return res.status(404).send()
  if (!config.oauthServer?.enabled) return res.status(404).send()
  if (path === '/api/oauth/authorize' && !config.oauthServer?.authorizationCode) return res.status(404).send()

  const ctx = await issuerOfSite(await reqSite(req), canonicalSiteUrl(reqSiteUrl(req)))
  if (!ctx) return res.status(404).send()
  if (path === '/api/oauth/token' && req.method === 'POST') {
    await new Promise<void>((resolve, reject) => tokenBodyParser(req, res, err => err ? reject(err) : resolve()))
    if (req.body?.grant_type === jwtBearerGrantType) return handleJwtBearerGrant(req, res, ctx)
  }

  const provider = await getProvider(ctx)

  if (path === oauthDiscovery) req.url = openidDiscovery + req.url.slice(oauthDiscovery.length)
  req.originalUrl = providerOriginalUrl(ctx.issuer, req.url)
  await providerCallback(provider)(req, res)
})
