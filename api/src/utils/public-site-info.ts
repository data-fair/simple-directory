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

const publicHost = new URL(config.publicUrl).host
export const getPublicSiteInfo = (site: Site): SitePublic => {
  const authMode = site.authMode ?? 'onlyBackOffice'
  let authOnlyOtherSite = site.authOnlyOtherSite
  if (authMode === 'onlyBackOffice') authOnlyOtherSite = publicHost
  return {
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
      logo: site.theme.logo || `/simple-directory/api/avatars/${site.owner.type}/${site.owner.id}/avatar.png`
    },
    authMode,
    authOnlyOtherSite
  }
}

const publicSiteInfoHashCache: Record<string, string> = {}
export const getPublicSiteInfoHash = (site: Site) => {
  const publicInfo = getPublicSiteInfo(site)
  const cacheKey = site?._id + '-' + site?.updatedAt
  publicSiteInfoHashCache[cacheKey] = publicSiteInfoHashCache[cacheKey] ?? crypto.createHash('md5').update(serialize(publicInfo)).digest('hex')
  return publicSiteInfoHashCache[cacheKey]
}

export type MainSitePresentation = {
  theme: Theme,
  title?: string,
  tosMessage?: string,
  reducedPersonalInfoAtCreation?: boolean,
  mails: { from?: string, contact?: string },
  // identity of the document actually contributing, used as a cache key;
  // undefined when every value comes from the environment
  docKey?: string
}

export const envMainSitePresentation = (): MainSitePresentation => ({
  theme: config.theme,
  mails: { from: config.mails.from, contact: config.contact }
})

// The main site is always a locally authenticated back-office, whatever its
// document says: authMode, authProviders, owner and isAccountMain are never
// taken from it. See docs/architecture/main-site-config.md
export const buildMainPublicSiteInfo = (presentation: MainSitePresentation): SitePublic & { main: true } => {
  const info: Record<string, any> = {
    main: true,
    host: publicHost,
    theme: lighterTheme(presentation.theme),
    title: presentation.title,
    tosMessage: presentation.tosMessage,
    reducedPersonalInfoAtCreation: presentation.reducedPersonalInfoAtCreation,
    isAccountMain: true,
    authMode: 'onlyLocal'
  }
  removeUndef(info)
  return info as SitePublic & { main: true }
}

export const defaultPublicSiteInfo = buildMainPublicSiteInfo(envMainSitePresentation())
export const defaultPublicSiteInfoHash = crypto.createHash('md5').update(serialize(defaultPublicSiteInfo)).digest('hex')
