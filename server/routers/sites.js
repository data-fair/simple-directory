const express = require('express')
const config = require('config')
const createError = require('http-errors')
const asyncWrap = require('../utils/async-wrap')
const sitePatchSchema = require('../../types/site-patch')
const sitePostSchema = require('../../types/site-post')
const sitePublicSchema = require('../../types/site-public')
const sitesResponseSchema = require('../../types/sites-response')
const sitesResponsePublicSchema = require('../../types/sites-response-public')
const sitesQuerySchema = require('../../types/sites-query')

const router = module.exports = express.Router()

const checkSecret = async (req) => {
  if (!req.query.key || req.query.key !== config.secretKeys.sites) {
    throw createError(401, 'wrong sites secret key')
  }
}

router.get('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  const query = await sitesQuerySchema.validate(req.query)
  if (query.showAll && !req.user.adminMode) return res.status(403).send()
  const response = query.showAll ? await req.app.get('storage').findAllSites() : await req.app.get('storage').findOwnerSites(req.user.accountOwner)
  for (const result of response.results) {
    result.logo = result.logo || `${req.publicBaseUrl}/api/avatars/${result.owner.type}/${result.owner.id}/avatar.png`
  }
  if (query.showAll) {
    res.type('json').send(sitesResponseSchema.stringify(response))
  } else {
    res.type('json').send(sitesResponsePublicSchema.stringify(response))
  }
}))

router.post('', asyncWrap(async (req, res, next) => {
  await checkSecret(req)
  const body = sitePostSchema.validate(req.body)
  await req.app.get('storage').patchSite(body, true)
  res.type('json').send(sitePostSchema.stringify(body))
}))

router.patch('/:id', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  if (!req.user.adminMode) return res.status(403).send()
  const body = sitePatchSchema.validate(req.body)
  await req.app.get('storage').patchSite(body)
  res.type('json').send(sitePatchSchema.stringify(body))
}))

router.delete('/:id', asyncWrap(async (req, res, next) => {
  await checkSecret(req)
  await req.app.get('storage').deleteSite(req.params.id)
  res.status(204).send()
}))

router.get('/_public', asyncWrap(async (req, res, next) => {
  if (!req.site) return res.status(404).send()
  req.site.logo = req.site.logo || `${req.publicBaseUrl}/api/avatars/${req.site.owner.type}/${req.site.owner.id}/avatar.png`
  // stringify will keep only parts that are public knowledge
  res.type('json').send(sitePublicSchema.stringify(req.site))
}))
