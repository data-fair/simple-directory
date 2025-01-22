import type { Colors, Theme } from '#types/site-public/index.ts'
import tinycolor from 'tinycolor2'
import { getMessage } from '#i18n'

// export const isDark = (color) => tinycolor(color).getLuminance() < 0.4

const readableOptions = { level: 'AA' as const, size: 'small' as const }

function readableWarning (readableOptions: tinycolor.WCAG2Options, locale: string, colorCode?: string, colorName?: string, bgColorCode?: string, bgColorName?: string, themeName?: string) {
  if (!colorCode || !bgColorCode) return
  if (!tinycolor.isReadable(colorCode, bgColorCode, readableOptions)) {
    return getMessage(locale, 'colors.readableWarning', { colorCode, colorName: getMessage(locale, `colors.${colorName}`), bgColorCode, bgColorName: getMessage(locale, `colors.${bgColorName}`), themeName: getMessage(locale, `colors.theme.${themeName}`) })
  }
}

function getColorsWarnings (locale: string, colors: Colors, themeName: string, readableOptions: tinycolor.WCAG2Options = { level: 'AA', size: 'small' }): string[] {
  const warnings: (string | undefined)[] = []
  for (const color of ['primary', 'secondary', 'accent', 'info', 'success', 'error', 'warning', 'admin']) {
    const textColor = colors[`text-${color}` as keyof Colors] ?? colors[color as keyof Colors]
    warnings.push(readableWarning(readableOptions, locale, textColor, `text-${color}`, colors.background, 'background', themeName))
    warnings.push(readableWarning(readableOptions, locale, textColor, `text-${color}`, colors.surface, 'surface', themeName))
  }
  for (const color of ['background', 'surface', 'primary', 'secondary', 'accent', 'info', 'success', 'error', 'warning', 'admin']) {
    warnings.push(readableWarning(readableOptions, locale, colors[`on-${color}` as keyof Colors], 'text', colors[color as keyof Colors], color, themeName))
  }
  return warnings.filter(w => w !== undefined)
}

export function getSiteColorsWarnings (locale: string, theme: Theme, authProviders?: { title?: string, color?: string }[]): string[] {
  let warnings: (string | undefined)[] = getColorsWarnings(locale, theme.colors, 'default')
  if (theme.dark && theme.darkColors) warnings = warnings.concat(getColorsWarnings(locale, theme.darkColors, 'dark'))
  if (theme.hc && theme.hcColors) warnings = warnings.concat(getColorsWarnings(locale, theme.hcColors, 'hc', { level: 'AAA', size: 'small' }))
  if (theme.hcDark && theme.hcDarkColors) warnings = warnings.concat(getColorsWarnings(locale, theme.hcDarkColors, 'hcDark', { level: 'AAA', size: 'small' }))
  if (authProviders) {
    for (const p of authProviders) {
      if (p.color && p.title) {
        if (!tinycolor.isReadable('#FFFFFF', p.color, readableOptions)) {
          warnings.push(getMessage(locale, 'colors.readableWarning', { colorCode: '#FFFFFF', colorName: getMessage(locale, 'colors.white'), bgColorCode: p.color, bgColorName: getMessage(locale, 'colors.authProvider', { title: p.title }) }))
        }
      }
    }
  }
  return warnings.filter(w => w !== undefined)
}
