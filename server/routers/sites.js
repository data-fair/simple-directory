const express = require('express')
const config = require('config')
const createError = require('http-errors')
const asyncWrap = require('../utils/async-wrap')
const oauth = require('../utils/oauth')

const router = module.exports = express.Router()

const checkSecret = async (req) => {
  if (!req.query.key || req.query.key !== config.secretKeys.sites) {
    throw createError(401, 'wrong sites secret key')
  }
}

router.get('', asyncWrap(async (req, res, next) => {
  const sitesResponseSchema = await import('../../types/sites-response/index.mjs')
  const sitesResponsePublicSchema = await import('../../types/sites-response-public/index.mjs')
  const sitesQuerySchema = await import('../../types/sites-query/index.mjs')

  if (!req.user) return res.status(401).send()
  const query = req.query
  // @ts-ignore
  sitesQuerySchema.assertValid(query)
  if (query.showAll && !req.user.adminMode) return res.status(403).send()
  const response = query.showAll ? await req.app.get('storage').findAllSites() : await req.app.get('storage').findOwnerSites(req.user.accountOwner)
  for (const result of response.results) {
    result.logo = result.logo || `${req.publicBaseUrl}/api/avatars/${result.owner.type}/${result.owner.id}/avatar.png`
    if (result.authProviders) {
      for (const p of result.authProviders) {
        if (p.type === 'oidc') p.id = oauth.getProviderId(p.discovery)
      }
    }
  }
  if (query.showAll) {
    res.type('json').send(sitesResponseSchema.stringify(response))
  } else {
    res.type('json').send(sitesResponsePublicSchema.stringify(response))
  }
}))

router.post('', asyncWrap(async (req, res, next) => {
  const sitePostSchema = await import('../../types/site-post/index.mjs')

  await checkSecret(req)
  // @ts-ignore
  sitePostSchema.assertValid(req.body)
  await req.app.get('storage').patchSite(req.body, true)
  res.type('json').send(sitePostSchema.stringify(req.body))
}))

router.patch('/:id', asyncWrap(async (req, res, next) => {
  const sitePatchSchema = await import('../../types/site-patch/index.mjs')

  if (!req.user) return res.status(401).send()
  if (!req.user.adminMode) return res.status(403).send()
  // @ts-ignore
  sitePatchSchema.assertValid(req.body)
  await req.app.get('storage').patchSite(req.body)
  res.type('json').send(sitePatchSchema.stringify(req.body))
}))

router.delete('/:id', asyncWrap(async (req, res, next) => {
  await checkSecret(req)
  await req.app.get('storage').deleteSite(req.params.id)
  res.status(204).send()
}))

router.get('/_public', asyncWrap(async (req, res, next) => {
  const sitePublicSchema = await import('../../types/site-public/index.mjs')

  if (!req.site) return res.status(404).send()
  req.site.logo = req.site.logo || `${req.publicBaseUrl}/api/avatars/${req.site.owner.type}/${req.site.owner.id}/avatar.png`
  // stringify will keep only parts that are public knowledge
  res.type('json').send(sitePublicSchema.stringify(req.site))
}))
