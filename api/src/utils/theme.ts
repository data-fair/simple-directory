import config from '../config.ts'
import crypto from 'node:crypto'
import { type Site } from '../../types/index.ts'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import { getTextColorsCss, type Theme } from '@data-fair/lib-common-types/theme/index.js'

export const getThemeCss = (theme: Theme, sitePath: string = '') => {
  let css = '@media print { .v-application { background-color: transparent; } }'
  css += getTextColorsCss(theme.colors, 'default')
  if (theme.dark && theme.darkColors) css += getTextColorsCss(theme.darkColors, 'dark')
  if (theme.hc && theme.hcColors) css += getTextColorsCss(theme.hcColors, 'hc')
  if (theme.hcDark && theme.hcDarkColors) css += getTextColorsCss(theme.hcDarkColors, 'hc-dark')
  // Resolve the font names first — defaulting to the legacy "BodyFontFamily" / "HeadingFontFamily"
  // aliases when not explicitly configured — so they can be substituted into the {FONT_FAMILY}
  // placeholder of the *Css @font-face rules. This keeps the @font-face family in sync with the
  // CSS variables below and avoids emitting a literal `undefined` (or an unsubstituted
  // {FONT_FAMILY}) when only the CSS, not the name, is configured.
  const bodyFontFamily = theme?.bodyFontFamily || config.theme.bodyFontFamily || 'BodyFontFamily'
  const bodyFontFamilyCss = theme?.bodyFontFamilyCss ?? config.theme.bodyFontFamilyCss ?? ''
  const headingFontFamilyCss = theme?.headingFontFamilyCss ?? config.theme.headingFontFamilyCss
  // Headings use a distinct "HeadingFontFamily" alias when a heading @font-face is provided (so
  // it doesn't collide with the body @font-face name); otherwise they inherit the body font.
  const headingFontFamily = theme?.headingFontFamily || config.theme.headingFontFamily || (headingFontFamilyCss ? 'HeadingFontFamily' : bodyFontFamily)
  css += '\n' + microTemplate(bodyFontFamilyCss, { SITE_PATH: sitePath, FONT_FAMILY: bodyFontFamily })
  if (headingFontFamilyCss) {
    css += '\n' + microTemplate(headingFontFamilyCss, { SITE_PATH: sitePath, FONT_FAMILY: headingFontFamily })
  }
  css += `
:root {
  --d-body-font-family: ${bodyFontFamily} !important;
  --d-heading-font-family: ${headingFontFamily} !important;
}
  `
  return css
}

const themeCssHashCache: Record<string, string> = {}
export const getThemeCssHash = (site: Site) => {
  const cacheKey = site._id + '-' + site.updatedAt
  themeCssHashCache[cacheKey] = themeCssHashCache[cacheKey] ?? crypto.createHash('md5').update(getThemeCss(site.theme, site.path)).digest('hex')
  return themeCssHashCache[cacheKey]
}

export const defaultThemeCss = getThemeCss(config.theme)
export const defaultThemeCssHash = crypto.createHash('md5').update(defaultThemeCss).digest('hex')
