import { type SitePublic } from '#types'
import { Router, type Request } from 'express'
import config from '#config'
import { reqUser, reqUserAuthenticated, reqSiteUrl, httpError, reqSessionAuthenticated, reqHost } from '@data-fair/lib-express'
import { nanoid } from 'nanoid'
import { findAllSites, findOwnerSites, patchSite, deleteSite, getSiteColors } from './service.ts'
import { reqSite } from '#services'
import { reqI18n } from '#i18n'
import { getOidcProviderId } from '../oauth/oidc.ts'
import { getColorsWarnings } from '../utils/color.ts'

const router = Router()
export default router

const checkSecret = async (req: Request) => {
  if (!reqUser(req)?.adminMode && (!req.query.key || req.query.key !== config.secretKeys.sites)) {
    throw httpError(401, 'wrong sites secret key')
  }
}

router.get('', async (req, res, next) => {
  const sessionState = reqSessionAuthenticated(req)
  const { query } = (await import('#doc/sites/list-req/index.ts')).returnValid(req, { name: 'req' })
  if (query.showAll && !reqUser(req)?.adminMode) throw httpError(403)
  if (query.showAll) {
    const response = await findAllSites()
    for (const result of response.results) {
      result.logo = result.logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${result.owner.type}/${result.owner.id}/avatar.png`
      if (result.authProviders) {
        for (const p of result.authProviders) {
          if (p.type === 'oidc') p.id = getOidcProviderId(p.discovery)
        }
      }
    }
    res.send(response)
  } else {
    const response = await findOwnerSites(sessionState.account)
    for (const result of response.results) {
      result.logo = result.logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${sessionState.account.type}/${sessionState.account.id}/avatar.png`
    }
    res.send(response)
  }
})

router.post('', async (req, res, next) => {
  await checkSecret(req)
  const site = (await import('#doc/sites/post-req-body/index.ts')).returnValid(req.body, { name: 'req.body' })
  if (site.path?.endsWith('/')) site.path = site.path.slice(0, -1)
  if (site.path === '') delete site.path
  const patchedSite = await patchSite({ ...site, _id: site._id ?? nanoid() }, true)
  res.send(patchedSite)
})

router.patch('/:id', async (req, res, next) => {
  if (!reqUserAuthenticated(req)?.adminMode) throw httpError(403)
  const patch = (await import('#doc/sites/patch-req-body/index.ts')).returnValid(req.body, { name: 'req.body' })
  const patchedSite = await patchSite({ _id: req.params.id, ...patch })
  res.send(patchedSite)
})

router.delete('/:id', async (req, res, next) => {
  await checkSecret(req)
  await deleteSite(req.params.id)
  res.status(204).send()
})

router.get('/_public', async (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=60')

  const site = await reqSite(req)
  if (!site) {
    const sitePublic: SitePublic = {
      main: true,
      host: reqHost(req),
      colors: config.theme.colors,
      authMode: 'onlyLocal'
    }
    res.send(sitePublic)
  } else {
    const sitePublic: SitePublic = {
      host: site.host,
      logo: site.logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${site.owner.type}/${site.owner.id}/avatar.png`,
      colors: getSiteColors(site),
      authMode: site.authMode ?? 'onlyBackOffice'
    }
    res.send(sitePublic)
  }
})

router.get('/:id/_theme_warnings', async (req, res, next) => {
  const site = await reqSite(req)
  const { localeCode } = reqI18n(req)
  const colors = site ? getSiteColors(site) : config.theme.colors
  res.send(getColorsWarnings(localeCode, colors, site?.authProviders as { title?: string, color?: string }[]))
})
