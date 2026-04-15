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
  const bodyFontFamilyCss = theme?.bodyFontFamilyCss ?? config.theme.bodyFontFamilyCss ?? ''
  css += '\n' + microTemplate(bodyFontFamilyCss, { SITE_PATH: sitePath })
  const headingFontFamilyCss = theme?.headingFontFamilyCss ?? config.theme.headingFontFamilyCss
  if (headingFontFamilyCss) {
    css += '\n' + microTemplate(headingFontFamilyCss, { SITE_PATH: sitePath })
  }

  const bodyFontFamily = theme?.bodyFontFamily || config.theme.bodyFontFamily
  const headingFontFamily = theme?.headingFontFamily || config.theme.headingFontFamily || bodyFontFamily
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
