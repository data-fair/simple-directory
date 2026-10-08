import { httpError } from '@data-fair/lib-express'
import clone from '@data-fair/lib-utils/clone.js'
import { type EffectiveSite } from './public-site-info.ts'
import { getOnColor, getReadableColor, getTonalBg, getSiteColorsWarnings, type Theme } from '@data-fair/lib-common-types/theme/index.js'

/**
 * Local color override of a site theme, read from the `_t_*` query parameters
 * of the non-hashed presentation endpoints (`_public`, `_public.js`,
 * `_theme.css`). It lets a single page — typically a data-fair application
 * embedded in an external site — render with other colors than its site's
 * without any override logic in the page itself.
 */
export type ThemeOverride = { primary?: string, secondary?: string }

const overridableColors = ['primary', 'secondary'] as const

const hexColorRegexp = /^#?([0-9a-fA-F]{6})$/

export const parseThemeOverride = (query: Record<string, unknown>): ThemeOverride | undefined => {
  let override: ThemeOverride | undefined
  for (const key of overridableColors) {
    const value = query[`_t_${key}`]
    if (value === undefined) continue
    const match = typeof value === 'string' && value.match(hexColorRegexp)
    if (!match) throw httpError(400, `_t_${key} must be a 6 digits hexadecimal color`)
    override = override ?? {}
    override[key] = '#' + match[1].toUpperCase()
  }
  return override
}

const palettes = [
  { key: 'colors', dark: false, level: 'AA' },
  { key: 'darkColors', dark: true, level: 'AA' },
  { key: 'hcColors', dark: false, level: 'AAA' },
  { key: 'hcDarkColors', dark: true, level: 'AAA' }
] as const

/**
 * Same derivation as the assisted mode of fillTheme (on-* and contrast
 * corrected text-* variants in every palette), but applied on top of the
 * site's own palettes instead of resetting them to the defaults: a manually
 * themed site keeps its backgrounds, surfaces, etc.
 */
export const applyThemeOverride = (theme: Theme, override: ThemeOverride): Theme => {
  const result = clone(theme)
  for (const key of overridableColors) {
    const color = override[key]
    if (!color) continue
    if (result.assistedModeColors) result.assistedModeColors[key] = color
    for (const palette of palettes) {
      const colors = result[palette.key]
      if (!colors) continue
      colors[key] = color
      colors[`on-${key}`] = getOnColor(color)
      const bgColors = [colors.background, colors.surface, getTonalBg(color, colors.background), getTonalBg(color, colors.surface)]
      colors[`text-${key}`] = getReadableColor(color, bgColors, palette.dark, palette.level)
    }
  }
  return result
}

/**
 * Only the warnings the override introduced, the site's own are the
 * business of its administrators and are reported in the back-office.
 */
export const getThemeOverrideWarnings = (locale: 'fr' | 'en', theme: Theme, overriddenTheme: Theme) => {
  const siteWarnings = new Set(getSiteColorsWarnings(locale, theme))
  return getSiteColorsWarnings(locale, overriddenTheme).filter(w => !siteWarnings.has(w))
}

// the _t_* parameters are free user input, every distinct value is a cache entry: keep it bounded
const overriddenSitesCache = new Map<string, { site: EffectiveSite, colorWarnings: string[] }>()
const overriddenSitesCacheMax = 1000

export const getOverriddenSite = (site: EffectiveSite, override: ThemeOverride, locale: 'fr' | 'en') => {
  const cacheKey = [site._id, site.updatedAt, locale, override.primary, override.secondary].join('-')
  let cached = overriddenSitesCache.get(cacheKey)
  if (!cached) {
    const theme = applyThemeOverride(site.theme, override)
    cached = { site: { ...site, theme }, colorWarnings: getThemeOverrideWarnings(locale, site.theme, theme) }
    if (overriddenSitesCache.size >= overriddenSitesCacheMax) {
      overriddenSitesCache.delete(overriddenSitesCache.keys().next().value as string)
    }
    overriddenSitesCache.set(cacheKey, cached)
  }
  return cached
}

export const clearOverriddenSitesCache = () => {
  overriddenSitesCache.clear()
}
