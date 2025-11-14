import config from '../config.ts'
import crypto from 'node:crypto'
import microTemplate from '@data-fair/lib-utils/micro-template.js'
import { getTextColorsCss, type Theme } from '@data-fair/lib-common-types/theme/index.js'

export const getThemeCss = (theme: Theme, sitePath: string = '') => {
  let css = '@media print { .v-application { background-color: transparent; } }'
  css += getTextColorsCss(theme.colors, 'default')
  if (theme.dark && theme.darkColors) css += getTextColorsCss(theme.darkColors, 'dark')
  if (theme.hc && theme.hcColors) css += getTextColorsCss(theme.hcColors, 'hc')
  if (theme.hcDark && theme.hcDarkColors) css += getTextColorsCss(theme.hcDarkColors, 'hc-dark')
  css += '\n' + microTemplate(theme?.bodyFontFamilyCss ?? config.theme.bodyFontFamilyCss ?? '', { SITE_PATH: sitePath, FONT_FAMILY: 'BodyFontFamily' })
  if (theme?.headingFontFamilyCss) {
    css += '\n' + microTemplate(theme?.headingFontFamilyCss, { SITE_PATH: sitePath, FONT_FAMILY: 'HeadingFontFamily' })
  } else if (!theme?.bodyFontFamily && !theme?.headingFontFamily) {
    // this condition is met on older sites where we used BodyFontFamily and HeadingFontFamily aliases
    css += '\n' + microTemplate(theme?.bodyFontFamilyCss ?? config.theme.headingFontFamilyCss ?? config.theme.bodyFontFamilyCss ?? '', { SITE_PATH: sitePath, FONT_FAMILY: 'HeadingFontFamily' })
  }

  css += `
:root {
  --d-body-font-family: ${theme?.bodyFontFamily || 'BodyFontFamily'} !important;
  --d-heading-font-family: ${theme?.headingFontFamily || theme?.bodyFontFamily || 'HeadingFontFamily'} !important;
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
