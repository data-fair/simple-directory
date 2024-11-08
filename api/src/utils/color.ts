import type { Colors } from '#types/site-public/index.ts'
import tinycolor from 'tinycolor2'

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

function readableWarning (color: string, colorName: string, colors: Colors) {
  if (!tinycolor.isReadable(color, colors.background, readableOptions)) {
    return `la couleur ${colorName} (${color}) n'est pas suffisamment lisible par dessus la couleur d'arrière plan (${colors.background})`
  }
  if (!tinycolor.isReadable(color, colors.surface, readableOptions)) {
    return `la couleur ${colorName} (${color}) n'est pas suffisamment lisible par dessus la couleur de surface (${colors.surface})`
  }
  if (!tinycolor.isReadable('#FFFFFF', color, readableOptions)) {
    return `le blanc n'est pas suffisamment lisible par dessus la couleur ${colorName} (${color})`
  }
}

export function getColorsWarnings (colors: Colors, authProviders?: { title?: string, color?: string }[]): string[] {
  const warnings: (string | undefined)[] = []
  warnings.push(readableWarning(colors.primary, 'primaire', colors))
  if (authProviders) {
    for (const p of authProviders) {
      if (p.color && p.title) {
        warnings.push(readableWarning(p.color, `du fournisseur d'identité ${p.title}`, colors))
      }
    }
  }
  return warnings.filter(w => w !== undefined)
}
