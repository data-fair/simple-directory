import crypto from 'node:crypto'
import serialize from 'serialize-javascript'
import config from '#config'
import { type Site, type SitePublic } from '#types'
import { getMessage } from '#i18n'
import { getMainSiteDoc } from './service.ts'
import {
  type MainSitePresentation,
  envMainSitePresentation,
  buildMainPublicSiteInfo,
  defaultPublicSiteInfo,
  defaultPublicSiteInfoHash
} from '../utils/public-site-info.ts'
import { getThemeCss, defaultThemeCss, defaultThemeCssHash } from '../utils/theme.ts'

export type { MainSitePresentation }

export type MainSiteCategory = 'theme' | 'title' | 'mails' | 'registration'

export const mainSiteCategories: MainSiteCategory[] = ['theme', 'title', 'mails', 'registration']

// Fields of a site document that are never honoured on the main host, whatever
// config.mainSiteFromDb contains. They are inert here, not refused: the API
// blocks no write (see docs/architecture/main-site-config.md for why a write
// barrier was rejected).
export const mainSiteIgnoredFields = ['authMode', 'authOnlyOtherSite', 'authProviders', 'applications', 'isAccountMain'] as const

export const mainSiteCategoryFields: Record<MainSiteCategory, (keyof Site)[]> = {
  theme: ['theme'],
  title: ['title'],
  mails: ['mails'],
  registration: ['tosMessage', 'reducedPersonalInfoAtCreation']
}

// read config at call time, not at module load: tests mutate it through
// PATCH /api/test-env/config
const enabled = (category: MainSiteCategory) => config.mainSiteFromDb.includes(category)

export const getMainSitePresentation = async (): Promise<MainSitePresentation> => {
  const doc = await getMainSiteDoc()
  const used: MainSiteCategory[] = []
  const presentation = envMainSitePresentation()
  if (doc) {
    if (enabled('theme') && doc.theme) {
      presentation.theme = doc.theme
      // unlike an ordinary site the owner avatar is the last resort, not the
      // first: the main site's identity is the operator's, not the owner org's
      if (!presentation.theme.logo && !config.theme.logo) {
        presentation.theme = { ...presentation.theme, logo: `/simple-directory/api/avatars/${doc.owner.type}/${doc.owner.id}/avatar.png` }
      }
      used.push('theme')
    }
    if (enabled('title') && doc.title) {
      presentation.title = doc.title
      used.push('title')
    }
    if (enabled('mails') && doc.mails) {
      presentation.mails = {
        from: doc.mails.from ?? presentation.mails.from,
        contact: doc.mails.contact ?? presentation.mails.contact
      }
      used.push('mails')
    }
    if (enabled('registration') && (doc.tosMessage !== undefined || doc.reducedPersonalInfoAtCreation !== undefined)) {
      presentation.tosMessage = doc.tosMessage
      presentation.reducedPersonalInfoAtCreation = doc.reducedPersonalInfoAtCreation
      used.push('registration')
    }
    if (used.length) presentation.docKey = `${doc._id}-${doc.updatedAt}-${used.join(',')}`
  }
  return presentation
}

type MainSiteResources = {
  publicInfo: SitePublic & { main: true },
  publicInfoHash: string,
  themeCss: string,
  themeCssHash: string
}

// the env baseline, shared with ui/vite.config.ts so dev and prod inject the
// same hashes when no document contributes
const envResources: MainSiteResources = {
  publicInfo: defaultPublicSiteInfo,
  publicInfoHash: defaultPublicSiteInfoHash,
  themeCss: defaultThemeCss,
  themeCssHash: defaultThemeCssHash
}

const resourcesCache: Record<string, MainSiteResources> = {}

// Hashes are computed from the content actually served, so _hashes and
// /:hash/_theme.css cannot diverge (they used to: app.ts read the document
// while the endpoints read env, and the mismatched hash was cached immutable
// for a year).
export const getMainSiteResources = async (): Promise<MainSiteResources> => {
  const presentation = await getMainSitePresentation()
  if (!presentation.docKey) return envResources
  if (!resourcesCache[presentation.docKey]) {
    const publicInfo = buildMainPublicSiteInfo(presentation)
    const themeCss = getThemeCss(presentation.theme)
    resourcesCache[presentation.docKey] = {
      publicInfo,
      publicInfoHash: crypto.createHash('md5').update(serialize(publicInfo)).digest('hex'),
      themeCss,
      themeCssHash: crypto.createHash('md5').update(themeCss).digest('hex')
    }
  }
  return resourcesCache[presentation.docKey]
}

export const clearMainSiteCache = () => {
  for (const key of Object.keys(resourcesCache)) delete resourcesCache[key]
}

// Fields the document carries that have no effect on the main host.
export const getMainSiteIgnoredFields = (site: Site): string[] =>
  mainSiteIgnoredFields.filter(field => site[field] !== undefined)

// Human readable report for the admin UI and the boot check. Nothing here
// blocks a write: the admin form round-trips the whole document, so a write
// barrier would reject an idempotent save. See
// docs/architecture/main-site-config.md
export const getMainSiteWarnings = (localeCode: string, site: Site): string[] => {
  const warnings: string[] = []
  for (const field of getMainSiteIgnoredFields(site)) {
    warnings.push(getMessage(localeCode, 'mainSite.ignoredField', { field }))
  }
  for (const category of mainSiteCategories) {
    if (config.mainSiteFromDb.includes(category)) continue
    if (!mainSiteCategoryFields[category].some(field => site[field] !== undefined)) continue
    warnings.push(getMessage(localeCode, 'mainSite.ignoredCategory', { category }))
  }
  return warnings
}
