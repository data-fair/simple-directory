import { Router } from 'express'
import config from '#config'
import { reqUser } from '@data-fair/lib-express'
const createError = require('http-errors')
const { nanoid } = require('nanoid')
const oauth = require('../utils/oauth')

const router = export default  Router()

const checkSecret = async (req) => {
  if (!reqUser(req)?.adminMode && (!req.query.key || req.query.key !== config.secretKeys.sites)) {
    throw createError(401, 'wrong sites secret key')
  }
}

router.get('', async (req, res, next) => {
  const sitesResponseSchema = await import('../../types/sites-response/index.mjs')
  const sitesResponsePublicSchema = await import('../../types/sites-response-public/index.mjs')
  const sitesQuerySchema = await import('../../types/sites-query/index.mjs')

  if (!reqUser(req)) return res.status(401).send()
  const query = req.query
  // @ts-ignore
  sitesQuerySchema.assertValid(query)
  if (query.showAll && !reqUser(req).adminMode) return res.status(403).send()
  const response = query.showAll ? await storages.globalStorage.findAllSites() : await storages.globalStorage.findOwnerSites(reqUser(req).accountOwner)
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
})

router.post('', async (req, res, next) => {
  const sitePostSchema = await import('../../types/site-post/index.mjs')
  await checkSecret(req)
  // @ts-ignore
  sitePostSchema.assertValid(req.body)
  req.body._id = req.body._id ?? nanoid()
  await storages.globalStorage.patchSite(req.body, true)
  res.type('json').send(sitePostSchema.stringify(req.body))
})

router.patch('/:id', async (req, res, next) => {
  const sitePatchSchema = await import('../../types/site-patch/index.mjs')

  if (!reqUser(req)) return res.status(401).send()
  if (!reqUser(req).adminMode) return res.status(403).send()
  // @ts-ignore
  sitePatchSchema.assertValid(req.body)
  await storages.globalStorage.patchSite(req.body)
  res.type('json').send(sitePatchSchema.stringify(req.body))
})

router.delete('/:id', async (req, res, next) => {
  await checkSecret(req)
  await storages.globalStorage.deleteSite(req.params.id)
  res.status(204).send()
})

router.get('/_public', async (req, res, next) => {
  const sitePublicSchema = await import('../../types/site-public/index.mjs')

  if (!req.site) return res.status(404).send()
  req.site.logo = req.site.logo || `${req.publicBaseUrl}/api/avatars/${req.site.owner.type}/${req.site.owner.id}/avatar.png`
  // stringify will keep only parts that are public knowledge
  res.type('json').send(sitePublicSchema.stringify(req.site))
})
