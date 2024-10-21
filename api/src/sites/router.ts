import { type SitePublic } from '#types'
import { Router, type Request } from 'express'
import config from '#config'
import { reqUser, reqUserAuthenticated, reqSiteUrl, httpError, reqSessionAuthenticated } from '@data-fair/lib-express'
import { nanoid } from 'nanoid'
import * as listReq from '#doc/sites/list-req/index.ts'
import * as postReq from '#doc/sites/post-req/index.ts'
import * as patchReq from '#doc/sites/patch-req/index.ts'
import { findAllSites, findOwnerSites, patchSite, deleteSite } from './service.ts'
import { reqSite } from './service.ts'
import { getProviderId } from '../oauth/oidc.ts'

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
        if (p.type === 'oidc') p.id = getProviderId(p.discovery)
      }
    }
  }
  res.send(response)
})

router.post('', async (req, res, next) => {
  await checkSecret(req)
  const { body: site } = postReq.returnValid(req, { name: 'req' })
  const patchedSite = await patchSite({ ...site, _id: site._id ?? nanoid() }, true)
  res.send(patchedSite)
})

router.patch('/:id', async (req, res, next) => {
  if (!reqUserAuthenticated(req)?.adminMode) return res.status(403).send()
  const { body: patch } = patchReq.returnValid(req, { name: 'req' })
  const patchedSite = await patchSite({ _id: req.params.id, ...patch })
  res.send(patchedSite)
})

router.delete('/:id', async (req, res, next) => {
  await checkSecret(req)
  await deleteSite(req.params.id)
  res.status(204).send()
})

router.get('/_public', async (req, res, next) => {
  const site = await reqSite(req)
  if (!site) return res.status(404).send()
  const sitePublic: SitePublic = {
    host: site.host,
    theme: site.theme,
    logo: site.logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${site.owner.type}/${site.owner.id}/avatar.png`,
    reducedPersonalInfoAtCreation: site.reducedPersonalInfoAtCreation,
    tosMessage: site.tosMessage,
    authMode: site.authMode,
    authOnlyOtherSite: site.authOnlyOtherSite
  }
  res.send(sitePublic)
})
