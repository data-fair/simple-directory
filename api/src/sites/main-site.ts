import config from '#config'
import { type Site } from '#types'
import { getMessage } from '#i18n'
import { getMainSiteDoc } from './service.ts'
import { type EffectiveSite, envMainSite, clearPublicSiteInfoHashCache } from '../utils/public-site-info.ts'
import { clearThemeCssHashCache } from '../utils/theme.ts'

type MainSiteCategory = 'theme' | 'title' | 'mails' | 'registration'

const mainSiteCategories: MainSiteCategory[] = ['theme', 'title', 'mails', 'registration']

// Fields of a site document that are never honoured on the main host, whatever
// config.mainSiteFromDb contains. They are inert here, not refused: the API
// blocks no write (see docs/architecture/main-site-config.md for why a write
// barrier was rejected).
const mainSiteIgnoredFields = ['authMode', 'authOnlyOtherSite', 'authProviders', 'applications', 'isAccountMain'] as const

const mainSiteCategoryFields: Record<MainSiteCategory, (keyof Site)[]> = {
  theme: ['theme'],
  title: ['title'],
  mails: ['mails'],
  registration: ['tosMessage', 'reducedPersonalInfoAtCreation']
}

// read config at call time, not at module load: tests mutate it through
// PATCH /api/test-env/config
const enabled = (category: MainSiteCategory) => config.mainSiteFromDb.includes(category)

/**
 * The main site as it should be served: env config, with the presentation
 * fields of its document overlaid for each enabled category.
 *
 * The result is an ordinary EffectiveSite, so every consumer runs it through
 * the same getPublicSiteInfo / getThemeCss / hash functions as a real site —
 * there is no parallel rendering path for the main host.
 */
export const getEffectiveMainSite = async (): Promise<EffectiveSite> => {
  const site = envMainSite()
  const doc = await getMainSiteDoc()
  if (!doc) return site

  const used: MainSiteCategory[] = []
  if (enabled('theme') && doc.theme) {
    site.theme = doc.theme
    // unlike an ordinary site the owner avatar is the last resort, not the
    // first: the main site's identity is the operator's, not the owner org's
    if (!site.theme.logo && !config.theme.logo) {
      site.theme = { ...site.theme, logo: `/simple-directory/api/avatars/${doc.owner.type}/${doc.owner.id}/avatar.png` }
    }
    used.push('theme')
  }
  if (enabled('title') && doc.title) {
    site.title = doc.title
    used.push('title')
  }
  if (enabled('mails') && doc.mails) {
    site.mails = {
      from: doc.mails.from ?? site.mails?.from,
      contact: doc.mails.contact ?? site.mails?.contact
    }
    used.push('mails')
  }
  if (enabled('registration') && (doc.tosMessage !== undefined || doc.reducedPersonalInfoAtCreation !== undefined)) {
    site.tosMessage = doc.tosMessage
    site.reducedPersonalInfoAtCreation = doc.reducedPersonalInfoAtCreation
    used.push('registration')
  }

  // the shared hash caches key on _id + updatedAt; fold the contributing
  // categories into the id so the key also changes when the category list does
  if (used.length) {
    site._id = `_main-${doc._id}-${used.join(',')}`
    site.updatedAt = doc.updatedAt
  }
  return site
}

// Only needed by tests, which flip config.mainSiteFromDb at runtime — the
// shared hash caches key on _id + updatedAt and cannot see that change.
export const clearSiteResourceCaches = () => {
  clearPublicSiteInfoHashCache()
  clearThemeCssHashCache()
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
