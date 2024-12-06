import type { Colors } from '#types/site-public/index.ts'
import tinycolor from 'tinycolor2'
import { getMessage } from '#i18n'

// export const isDark = (color) => tinycolor(color).getLuminance() < 0.4

const readableOptions = { level: 'AA' as const, size: 'small' as const }

/* TODO:
  - add a default text color (mostly to switch between a dark gray and black)
  - extend site colors configuration to more colors than primary
  - check for other color warnings based on what colors are actually used as text of button background, etc in our services
  - detect that some configured colors should be used with light or dark text (example: a light primary color should be displayed with dark grey or black text)
*/

// calculate a variant of a color with guaranteed readability
// default background is #FAFAFA the light grey background
// TODO: deprecate this, instead we rely on warnings showed to admins when the colors they chose don't have a sufficient contrast
/* const contrastColorCache: Record<string, string> = {}
export const readableColor = (color: string, colors: Colors) => {
  const cacheKey = JSON.stringify([color, colors.background, colors.surface])
  if (contrastColorCache[cacheKey]) return contrastColorCache[cacheKey]
  const c = tinycolor(color)
  const b = tinycolor(colors.background)
  const s = tinycolor(colors.background)
  while (!tinycolor.isReadable(c, b, readableOptions) || !tinycolor.isReadable(c, s, readableOptions)) {
    c.darken(1)
  }
  contrastColorCache[cacheKey] = c.toString()
  return contrastColorCache[cacheKey]
} */

function readableWarning (locale: string, colorCode?: string, colorName?: string, bgColorCode?: string, bgColorName?: string) {
  if (!colorCode || !bgColorCode) return
  if (!tinycolor.isReadable(colorCode, bgColorCode, readableOptions)) {
    return getMessage(locale, 'colors.readableWarning', { colorCode, colorName: getMessage(locale, `colors.${colorName}`), bgColorCode, bgColorName: getMessage(locale, `colors.${bgColorName}`) })
  }
}

export function getColorsWarnings (locale: string, colors: Colors, authProviders?: { title?: string, color?: string }[]): string[] {
  const warnings: (string | undefined)[] = []
  for (const color of ['primary']) {
    warnings.push(readableWarning(locale, colors[`${color}-text` as keyof Colors], color, colors.background, 'background'))
    warnings.push(readableWarning(locale, colors[`${color}-text` as keyof Colors], color, colors.surface, 'surface'))
  }
  for (const color of ['background', 'surface', 'primary', 'secondary', 'accent', 'error', 'warning', 'info', 'success', 'admin']) {
    warnings.push(readableWarning(locale, colors[`on-${color}` as keyof Colors], 'text', colors[color as keyof Colors], color))
  }
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
