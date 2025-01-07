import { type Site, type SitePublic } from '#types'
import { Router, type Request } from 'express'
import config from '#config'
import { reqUser, reqUserAuthenticated, reqSiteUrl, httpError, reqSessionAuthenticated, reqHost, reqSitePath } from '@data-fair/lib-express'
import { nanoid } from 'nanoid'
import { findAllSites, findOwnerSites, patchSite, deleteSite, getSite } from './service.ts'
import { reqSite } from '#services'
import { reqI18n } from '#i18n'
import { getOidcProviderId } from '../oauth/oidc.ts'
import { getSiteColorsWarnings } from '../utils/color.ts'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import { fillTheme, getTextColorsCss } from '@sd/shared/site.ts'
import clone from '@data-fair/lib-utils/clone.js'
import Debug from 'debug'

const debugPostSite = Debug('post-site')

const router = Router()
export default router

const checkSecret = async (req: Request) => {
  if (!reqUser(req)?.adminMode && (!req.query.key || req.query.key !== config.secretKeys.sites)) {
    throw httpError(401, 'wrong sites secret key')
  }
}

const prepareFullSite = (req: Request, site: Site) => {
  site.theme.logo = site.theme.logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${site.owner.type}/${site.owner.id}/avatar.png`
  if (site.authProviders) {
    for (const p of site.authProviders) {
      if (p.type === 'oidc') p.id = getOidcProviderId(p.discovery)
    }
  }
  const resultWithColorWarnings: any = site as any
  const { localeCode } = reqI18n(req)
  resultWithColorWarnings.colorWarnings = getSiteColorsWarnings(localeCode, site.theme, site.authProviders as { title?: string, color?: string }[])
}

router.get('', async (req, res, next) => {
  const sessionState = reqSessionAuthenticated(req)
  const { query } = (await import('#doc/sites/list-req/index.ts')).returnValid(req, { name: 'req' })
  if (query.showAll && !reqUser(req)?.adminMode) throw httpError(403)
  if (query.showAll) {
    const response = await findAllSites()
    for (const result of response.results) {
      prepareFullSite(req, result)
    }
    res.send(response)
  } else {
    const response = await findOwnerSites(sessionState.account)
    for (const result of response.results) {
      result.theme.logo = result.theme.logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${sessionState.account.type}/${sessionState.account.id}/avatar.png`
    }
    res.send(response)
  }
})

router.post('', async (req, res, next) => {
  await checkSecret(req)
  const body = req.body
  debugPostSite('received POST', body)

  let existingSite
  if (body._id) existingSite = await getSite(req.body._id)

  // manage retro-compatibility with old portals manager
  if (body.theme?.primaryColor) {
    debugPostSite('manage retro-compatibility with old portals manager')
    if (existingSite?.theme) {
      debugPostSite('patching existing theme with new primary color')
      const theme = clone(existingSite?.theme)
      if (theme.assistedMode && theme.assistedModeColors) {
        theme.assistedModeColors.primary = body.theme.primaryColor
        body.theme = fillTheme(theme, config.theme)
      } else {
        theme.colors.primary = body.theme.primaryColor
        body.theme = theme
      }
    } else {
      debugPostSite('init a new theme from env level config')
      const theme = clone(config.theme)
      theme.dark = false
      theme.hc = false
      theme.hcDark = false
      theme.colors.primary = body.theme.primaryColor
      theme.assistedMode = true
      theme.assistedModeColors = {
        primary: body.theme.primaryColor
      }
      theme.colors.background = '#FFFFFF'
      body.theme = fillTheme(theme, config.theme)
    }
    if (body.logo) {
      body.theme.logo = body.logo
      delete body.logo
    }
    debugPostSite('processed body for retro-compatibility', body)
  }

  const postSite = (await import('#doc/sites/post-req-body/index.ts')).returnValid(body, { name: 'req.body' })
  if (!postSite.theme) {
    const theme = clone(config.theme)
    theme.dark = false
    theme.hc = false
    theme.hcDark = false
    theme.assistedMode = true
    theme.assistedModeColors = {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      accent: theme.colors.accent,
    }
    postSite.theme = theme
  }
  if (postSite.path?.endsWith('/')) postSite.path = postSite.path.slice(0, -1)
  if (postSite.path === '') delete postSite.path
  const patchedSite = await patchSite({ ...postSite, _id: postSite._id ?? nanoid() }, true)
  debugPostSite('patched site', patchedSite._id)
  res.send(patchedSite)
})

router.patch('/:id', async (req, res, next) => {
  if (!reqUserAuthenticated(req)?.adminMode) throw httpError(403)
  const body = req.body

  const site = await getSite(req.params.id)
  if (!site) throw httpError(404)

  if (body.theme.primaryColor || body.logo) {
    // manage re-reo-compatibility with old portals manager
    const theme = clone(site.theme)
    if (body.theme.primaryColor) {
      theme.colors.primary = body.theme.primaryColor
    }
    if (body.logo) {
      theme.logo = body.logo
    }
    body.theme = theme
  }

  const patch = (await import('#doc/sites/patch-req-body/index.ts')).returnValid(body, { name: 'req.body' })

  if (patch.theme) {
    patch.theme = fillTheme(patch.theme, config.theme)
  }

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
  const theme = { ...site?.theme ?? config.theme }
  if (!theme.dark) delete theme.darkColors
  if (!theme.hc) delete theme.hcColors
  if (!site) {
    const sitePublic: SitePublic = {
      main: true,
      host: reqHost(req),
      theme,
      authMode: 'onlyLocal',
    }
    res.send(sitePublic)
  } else {
    const sitePublic: SitePublic = {
      host: site.host,
      theme: {
        ...theme,
        logo: site.theme.logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${site.owner.type}/${site.owner.id}/avatar.png`
      },
      authMode: site.authMode ?? 'onlyBackOffice'
    }
    res.send(sitePublic)
  }
})

router.get('/_default_theme', async (req, res, next) => {
  res.send(config.theme)
})

router.get('/_theme.css', async (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=60')
  const site = await reqSite(req)
  const sitePath = reqSitePath(req)
  let css = ''
  const theme = site?.theme ?? config.theme
  css += getTextColorsCss(theme.colors, 'default')
  if (theme.dark && theme.darkColors) css += getTextColorsCss(theme.darkColors, 'dark')
  if (theme.hc && theme.hcColors) css += getTextColorsCss(theme.hcColors, 'hc')
  if (theme.hcDark && theme.hcDarkColors) css += getTextColorsCss(theme.hcDarkColors, 'hc-dark')
  css += '\n' + microTemplate(site?.theme?.bodyFontFamilyCss ?? config.theme.bodyFontFamilyCss ?? '', { SITE_PATH: sitePath, FONT_FAMILY: 'BodyFontFamily' })
  css += '\n' + microTemplate(site?.theme?.headingFontFamilyCss ?? site?.theme?.bodyFontFamilyCss ?? config.theme.headingFontFamilyCss ?? config.theme.bodyFontFamilyCss ?? '', { SITE_PATH: sitePath, FONT_FAMILY: 'HeadingFontFamily' })
  res.contentType('css')
  res.send(css)
})

router.get('/:id/_theme_warnings', async (req, res, next) => {
  const site = await reqSite(req)
  const { localeCode } = reqI18n(req)
  res.send(getSiteColorsWarnings(localeCode, site?.theme ?? config.theme, site?.authProviders as { title?: string, color?: string }[]))
})

router.get('/:id', async (req, res, next) => {
  if (!reqSessionAuthenticated(req)?.user.adminMode) throw httpError(403)
  const site = await getSite(req.params.id)
  if (!site) throw httpError(404)
  prepareFullSite(req, site)
  res.send(site)
})
