import { type Site } from '#types'
import { Router, type Request } from 'express'
import config from '#config'
import { reqUser, reqUserAuthenticated, reqSiteUrl, httpError, reqSessionAuthenticated, type AccountKeys } from '@data-fair/lib-express'
import { nanoid } from 'nanoid'
import { findAllSites, findOwnerSites, patchSite, deleteSite, getSite, toggleMainSite } from './service.ts'
import { getThemeCss, getThemeCssHash, defaultThemeCssHash, defaultThemeCss } from '../utils/theme.ts'
import { isOIDCProvider, reqSite } from '#services'
import { reqI18n } from '#i18n'
import { getOidcProviderId } from '../oauth/oidc.ts'
import { getSiteColorsWarnings, fillTheme } from '@data-fair/lib-common-types/theme/index.js'
import clone from '@data-fair/lib-utils/clone.js'
import Debug from 'debug'
import { cipher } from '../utils/cipher.ts'
import { type OpenIDConnect } from '#types/site/index.ts'
import { defaultPublicSiteInfo, defaultPublicSiteInfoHash, getPublicSiteInfo, getPublicSiteInfoHash } from '../utils/public-site-info.ts'
import serialize from 'serialize-javascript'

const debugPostSite = Debug('post-site')

const router = Router()
export default router

const checkSecret = async (req: Request) => {
  if (!reqUser(req)?.adminMode && (!req.query.key || req.query.key !== config.secretKeys.sites)) {
    throw httpError(401, 'wrong sites secret key')
  }
}

const prepareFullSite = (req: Request, site: Site) => {
  site.theme.logo = site.theme.logo || `/simple-directory/api/avatars/${site.owner.type}/${site.owner.id}/avatar.png`
  if (site.authProviders) {
    for (const p of site.authProviders) {
      if (isOIDCProvider(p)) {
        p.id = getOidcProviderId(p.discovery)
        p.client.secret = '*****'
      }
    }
  }
  const resultWithColorWarnings: any = site as any
  const { localeCode } = reqI18n(req)
  resultWithColorWarnings.colorWarnings = getSiteColorsWarnings(localeCode as 'fr' | 'en', site.theme, site.authProviders as { title?: string, color?: string }[])
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
    let account: AccountKeys = sessionState.account
    if (query.owner) {
      const [type, id] = query.owner.split(':')
      if (type !== account.type || id !== account.id) {
        if (!reqUser(req)?.adminMode) throw httpError(403)
        account = { type: type as 'organization' | 'user', id }
      }
    }
    const response = await findOwnerSites(account)
    for (const result of response.results) {
      result.theme.logo = result.theme.logo || `${reqSiteUrl(req) + '/simple-directory'}/api/avatars/${account.type}/${account.id}/avatar.png`
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
      } else {
        theme.colors.primary = body.theme.primaryColor
      }
      body.theme = fillTheme(theme, config.theme)
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
  const patch: Partial<Site> & Pick<Site, '_id'> = { ...postSite, _id: postSite._id ?? nanoid() }
  if (postSite.contact) {
    patch.mails = existingSite?.mails ?? {}
    patch.mails.contact = postSite.contact
  }
  patch.updatedAt = new Date().toISOString()
  const patchedSite = await patchSite(patch, true)
  debugPostSite('patched site', patchedSite._id)
  res.send(patchedSite)
})

router.patch('/:id', async (req, res, next) => {
  if (!reqUserAuthenticated(req)?.adminMode) throw httpError(403)
  const body = req.body

  const site = await getSite(req.params.id)
  if (!site) throw httpError(404)

  if (body.theme?.primaryColor || body.logo) {
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

  if (patch.authProviders) {
    for (const authProvider of patch.authProviders) {
      if (isOIDCProvider(authProvider)) {
        if (typeof authProvider.client.secret === 'string' && authProvider.client.secret && !authProvider.client.secret.trim().match(/^\**$/)) {
          // @ts-ignore
          authProvider.client.secret = cipher(authProvider.client.secret)
        } else {
          const previousProvider = site.authProviders?.find(p => {
            return isOIDCProvider(p) && getOidcProviderId(p.discovery) === getOidcProviderId(authProvider.discovery)
          }) as OpenIDConnect | undefined
          if (!previousProvider) {
            throw httpError(400, 'no existing secret for provider ' + getOidcProviderId(authProvider.discovery))
          }
          // @ts-ignore
          authProvider.client.secret = previousProvider.client.secret
        }
      }
    }
  }

  const patchedSite = await patchSite({ _id: req.params.id, updatedAt: new Date().toISOString(), ...patch })

  if (patch.isAccountMain) {
    // toggle the main site
    await toggleMainSite(patchedSite)
  }

  res.send(patchedSite)
})

router.delete('/:id', async (req, res, next) => {
  await checkSecret(req)
  await deleteSite(req.params.id)
  res.status(204).send()
})

const hashedMaxAge = 60 * 60 * 24 * 365 // 365 days

router.get('/_public', async (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=60')
  const site = await reqSite(req)
  const publicSiteInfo = site ? await getPublicSiteInfo(site) : defaultPublicSiteInfo
  res.send(publicSiteInfo)
})
router.get('/_public.js', async (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=60')
  const site = await reqSite(req)
  const publicSiteInfo = site ? await getPublicSiteInfo(site) : defaultPublicSiteInfo
  res.contentType('application/javascript')
  res.send(`window.__PUBLIC_SITE_INFO=${serialize(publicSiteInfo)}`)
})
router.get('/:hash/_public.js', async (req, res, next) => {
  res.setHeader('Cache-Control', `public, max-age=${hashedMaxAge}, immutable`)
  const site = await reqSite(req)
  const publicSiteInfo = site ? await getPublicSiteInfo(site) : defaultPublicSiteInfo
  // TODO: fail if hash doesn't match ?
  res.contentType('application/javascript')
  res.send(`window.__PUBLIC_SITE_INFO=${serialize(publicSiteInfo)}`)
})

router.get('/_default_theme', async (req, res, next) => {
  res.send(config.theme)
})

router.get('/_theme.css', async (req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=60')
  const site = await reqSite(req)
  const css = site ? getThemeCss(site.theme, site.path ?? '') : defaultThemeCss
  res.contentType('css')
  res.send(css)
})
router.get('/:hash/_theme.css', async (req, res, next) => {
  res.setHeader('Cache-Control', `public, max-age=${hashedMaxAge}, immutable`)
  const site = await reqSite(req)
  // TODO: fail if hash doesn't match ?
  const css = site ? getThemeCss(site.theme, site.path ?? '') : defaultThemeCss
  res.contentType('css')
  res.send(css)
})
router.get('/_hashes', async (req, res, next) => {
  const site = await reqSite(req)
  res.send({
    publicInfo: site ? getPublicSiteInfoHash(site) : defaultPublicSiteInfoHash,
    themeCss: site ? getThemeCssHash(site) : defaultThemeCssHash
  })
})

router.get('/:id/_theme_warnings', async (req, res, next) => {
  const site = await reqSite(req)
  const { localeCode } = reqI18n(req)
  res.send(getSiteColorsWarnings(localeCode as 'fr' | 'en', site?.theme ?? config.theme, site?.authProviders as { title?: string, color?: string }[]))
})

router.get('/:id', async (req, res, next) => {
  if (!reqSessionAuthenticated(req)?.user.adminMode) throw httpError(403)
  const site = await getSite(req.params.id)
  if (!site) throw httpError(404)
  prepareFullSite(req, site)
  res.send(site)
})
