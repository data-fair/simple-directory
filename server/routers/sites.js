const express = require('express')
const config = require('config')
const createError = require('http-errors')
const asyncWrap = require('../utils/async-wrap')
const siteSchema = require('../../types/site')
const sitePublicSchema = require('../../types/site-public')
const sitesResponseSchema = require('../../types/sites-response')
const router = express.Router()

const checkSecret = async (req) => {
  if (!req.query.key || req.query.key !== config.secretKeys.sites) {
    throw createError(401, 'wrong sites secret key')
  }
}

router.get('', asyncWrap(async (req, res, next) => {
  if (!req.user) return res.status(401).send()
  const response = await req.app.get('storage').findOwnerSites(req.user.accountOwner)
  res.type('json').send(sitesResponseSchema.stringify(response))
}))

router.post('', asyncWrap(async (req, res, next) => {
  await checkSecret(req)
  const body = siteSchema.validate(req.body)
  await req.app.get('storage').saveSite(body)
  res.type('json').send(siteSchema.stringify(body))
}))

router.delete('/:id', asyncWrap(async (req, res, next) => {
  await checkSecret(req)
  await req.app.get('storage').deleteSite(req.params.id)
  res.status(204).send()
}))

router.get('/:host', asyncWrap(async (req, res, next) => {
  const site = await req.app.get('storage').getSiteByHost(req.params.host)
  if (!site) return res.status(404).send()
  // return only parts that are public knowledge
  res.type('json').send(sitePublicSchema.stringify({ host: site.host, theme: site.theme }))
}))
