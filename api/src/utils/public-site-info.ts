import crypto from 'node:crypto'
import { type Site, type SitePublic } from '../../types/index.ts'
import config from '../config.ts'
import serialize from 'serialize-javascript'
import { type Theme } from '@data-fair/lib-common-types/theme/index.js'
import clone from '@data-fair/lib-utils/clone.js'

const removeUndef = (obj?: Record<string, any>) => {
  if (!obj) return
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) delete obj[key]
  }
}

const lighterTheme = (fullTheme: Theme) => {
  const theme = clone(fullTheme)
  if (!theme.dark) delete theme.darkColors
  if (!theme.hc) delete theme.hcColors
  if (!theme.hcDark) delete theme.hcDarkColors
  removeUndef(theme.colors)
  removeUndef(theme.darkColors)
  removeUndef(theme.hcColors)
  removeUndef(theme.hcDarkColors)
  return theme
}

/**
 * A site as it is served. Either a real document, or the synthetic main site
 * built by sites/main-site.ts from env config overlaid with its document.
 *
 * The main site has no owner (its identity is the operator's, not an
 * organization's), so `owner` is optional here where the stored Site requires
 * it. Everything downstream treats both the same way.
 */
export type EffectiveSite = Omit<Site, 'owner'> & { owner?: Site['owner'], main?: true }

const publicHost = new URL(config.publicUrl).host

// The env-only main site. Kept free of any mongo access: ui/vite.config.ts
// imports defaultPublicSiteInfoHash below to inject the dev server's HTML.
// `path` is deliberately left undefined so the generated theme css keeps the
// empty SITE_PATH it has always used, even on a prefixed publicUrl.
export const envMainSite = (): EffectiveSite => ({
  _id: '_main',
  main: true,
  host: publicHost,
  theme: config.theme,
  mails: { from: config.mails.from, contact: config.contact },
  isAccountMain: true,
  authMode: 'onlyLocal'
})

export const getPublicSiteInfo = (site: EffectiveSite): SitePublic => {
  const authMode = site.authMode ?? 'onlyBackOffice'
  let authOnlyOtherSite = site.authOnlyOtherSite
  if (authMode === 'onlyBackOffice') authOnlyOtherSite = publicHost
  // an ordinary site falls back to its owner's avatar; the main site arrives
  // with its logo already resolved and has no owner to fall back to
  const logo = site.theme.logo || (site.owner && `/simple-directory/api/avatars/${site.owner.type}/${site.owner.id}/avatar.png`)
  return {
    // only emitted for the main site, so an ordinary site's payload — and
    // therefore its hash — is byte for byte what it was before
    ...(site.main ? { main: true } : {}),
    host: site.host,
    path: site.path,
    tmp: site.tmp,
    owner: site.owner,
    title: site.title,
    isAccountMain: site.isAccountMain,
    tosMessage: site.tosMessage,
    reducedPersonalInfoAtCreation: site.reducedPersonalInfoAtCreation,
    theme: {
      ...lighterTheme(site.theme ?? config.theme),
      ...(logo ? { logo } : {})
    },
    authMode,
    authOnlyOtherSite
  } as SitePublic
}

const publicSiteInfoHashCache: Record<string, string> = {}
export const getPublicSiteInfoHash = (site: EffectiveSite) => {
  const publicInfo = getPublicSiteInfo(site)
  const cacheKey = site?._id + '-' + site?.updatedAt
  publicSiteInfoHashCache[cacheKey] = publicSiteInfoHashCache[cacheKey] ?? crypto.createHash('md5').update(serialize(publicInfo)).digest('hex')
  return publicSiteInfoHashCache[cacheKey]
}

export const clearPublicSiteInfoHashCache = () => {
  for (const key of Object.keys(publicSiteInfoHashCache)) delete publicSiteInfoHashCache[key]
}

export const defaultPublicSiteInfo = getPublicSiteInfo(envMainSite())
export const defaultPublicSiteInfoHash = crypto.createHash('md5').update(serialize(defaultPublicSiteInfo)).digest('hex')
