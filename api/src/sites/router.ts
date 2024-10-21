import { Router, type Request } from 'express'
import config from '#config'
import { reqUser, reqSiteUrl, httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import { nanoid } from 'nanoid'
import storages from '#storages'
import * as listReq from '#doc/sites/list-req/index.ts'
import { findAllSites, findOwnerSites } from './service.ts'

const router = Router()
export default router

const checkSecret = async (req: Request) => {
  if (!reqUser(req)?.adminMode && (!req.query.key || req.query.key !== config.secretKeys.sites)) {
    throw httpError(401, 'wrong sites secret key')
  }
}

router.get('', async (req, res, next) => {
  const sessionState = reqSessionAuthenticated(req)
  const { query } = listReq.returnValid(req, { name: 'req' })
  if (query.showAll && !reqUser(req)?.adminMode) return res.status(403).send()
  const response = query.showAll ? await findAllSites() : await findOwnerSites(sessionState.account)
  for (const result of response.results) {
    result.logo = result.logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${result.owner.type}/${result.owner.id}/avatar.png`
    if (result.authProviders) {
      for (const p of result.authProviders) {
        if (p.type === 'oidc') p.id = oauth.getProviderId(p.discovery)
      }
    }
  }
  res.send(response)
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
  if (!reqUser(req)?.adminMode) return res.status(403).send()
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

  if (!await reqSite(req)) return res.status(404).send()
  await reqSite(req).logo = await reqSite(req).logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${await reqSite(req).owner.type}/${await reqSite(req).owner.id}/avatar.png`
  // stringify will keep only parts that are public knowledge
  res.type('json').send(sitePublicSchema.stringify(await reqSite(req)))
})
