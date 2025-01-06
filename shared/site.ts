import { type Colors, type Theme } from '../api/types/site-public/index.ts'
import clone from '@data-fair/lib-utils/clone.js'
import tinycolor from 'tinycolor2'

export const getTextColorsCss = (colors: Colors, theme: string) => {
  let css = ''
  for (const color of ['primary', 'secondary', 'accent', 'error', 'info', 'success', 'warning', 'admin']) {
    const key = `text-${color}` as keyof Colors
    if (colors[key]) {
      css += `
.v-theme--${theme} .text-${color} {
  color: ${colors[key]}!important;
}`
    }
  }
  return css
}

export const getReadableColor = (baseColor: string, bgColors: string [], darkMode: boolean, level: 'AA' | 'AAA') => {
  const c = tinycolor(baseColor)
  while (!bgColors.every(bgColor => tinycolor.isReadable(c, bgColor, { level, size: 'small' }))) {
    if (darkMode) {
      if (c.getBrightness() === 255) break
      c.brighten(1)
    } else {
      if (c.getBrightness() === 0) break
      c.darken(1)
    }
  }
  return c.toHexString()
}

export const fillTheme = (theme: Theme, defaultTheme: Theme) => {
  const fullTheme = clone(theme)
  if (fullTheme.assistedMode && fullTheme.assistedModeColors) {
    if (!defaultTheme.darkColors) throw new Error('darkColors is missing in default theme')
    if (!defaultTheme.hcColors) throw new Error('hcColors is missing in default theme')
    if (!defaultTheme.hcDarkColors) throw new Error('hcDarkColors is missing in default theme')
    fullTheme.assistedModeColors.primary = fullTheme.assistedModeColors.primary ?? fullTheme.colors.primary
    fullTheme.assistedModeColors.secondary = fullTheme.assistedModeColors.secondary ?? fullTheme.colors.secondary
    fullTheme.assistedModeColors.accent = fullTheme.assistedModeColors.accent ?? fullTheme.colors.accent
    fullTheme.colors = clone(defaultTheme.colors)
    fullTheme.darkColors = clone(defaultTheme.darkColors)
    fullTheme.hcColors = clone(defaultTheme.hcColors)
    fullTheme.hcDarkColors = clone(defaultTheme.hcDarkColors)
    const customColors = {
      primary: fullTheme.assistedModeColors.primary,
      secondary: fullTheme.assistedModeColors.secondary,
      accent: fullTheme.assistedModeColors.accent,
      'on-primary': tinycolor.mostReadable(fullTheme.assistedModeColors.primary, ['#000000', '#FFFFFF']).toHexString(),
      'on-secondary': tinycolor.mostReadable(fullTheme.assistedModeColors.secondary, ['#000000', '#FFFFFF']).toHexString(),
      'on-accent': tinycolor.mostReadable(fullTheme.assistedModeColors.accent, ['#000000', '#FFFFFF']).toHexString()
    }
    Object.assign(fullTheme.colors, customColors)
    Object.assign(fullTheme.darkColors, customColors)
    Object.assign(fullTheme.hcColors, customColors)
    Object.assign(fullTheme.hcDarkColors, customColors)
    fullTheme.colors['text-primary'] = getReadableColor(fullTheme.colors.primary, [fullTheme.colors.background, fullTheme.colors.surface], false, 'AA')
    fullTheme.colors['text-secondary'] = getReadableColor(fullTheme.colors.secondary, [fullTheme.colors.background, fullTheme.colors.surface], false, 'AA')
    fullTheme.colors['text-accent'] = getReadableColor(fullTheme.colors.accent, [fullTheme.colors.background, fullTheme.colors.surface], false, 'AA')
    fullTheme.darkColors['text-primary'] = getReadableColor(fullTheme.colors.primary, [fullTheme.darkColors.background, fullTheme.darkColors.surface], true, 'AA')
    fullTheme.darkColors['text-secondary'] = getReadableColor(fullTheme.colors.secondary, [fullTheme.darkColors.background, fullTheme.darkColors.surface], true, 'AA')
    fullTheme.darkColors['text-accent'] = getReadableColor(fullTheme.colors.accent, [fullTheme.darkColors.background, fullTheme.darkColors.surface], true, 'AA')
    fullTheme.hcColors['text-primary'] = getReadableColor(fullTheme.colors.primary, [fullTheme.hcColors.background, fullTheme.hcColors.surface], false, 'AAA')
    fullTheme.hcColors['text-secondary'] = getReadableColor(fullTheme.colors.secondary, [fullTheme.hcColors.background, fullTheme.hcColors.surface], false, 'AAA')
    fullTheme.hcColors['text-accent'] = getReadableColor(fullTheme.colors.accent, [fullTheme.hcColors.background, fullTheme.hcColors.surface], false, 'AAA')
    fullTheme.hcDarkColors['text-primary'] = getReadableColor(fullTheme.colors.primary, [fullTheme.hcDarkColors.background, fullTheme.hcDarkColors.surface], true, 'AAA')
    fullTheme.hcDarkColors['text-secondary'] = getReadableColor(fullTheme.colors.secondary, [fullTheme.hcDarkColors.background, fullTheme.hcDarkColors.surface], true, 'AAA')
    fullTheme.hcDarkColors['text-accent'] = getReadableColor(fullTheme.colors.accent, [fullTheme.hcDarkColors.background, fullTheme.hcDarkColors.surface], true, 'AAA')
  } else {
    fullTheme.assistedModeColors = {
      primary: fullTheme.colors.primary,
      secondary: fullTheme.colors.secondary,
      accent: fullTheme.colors.accent,
    }
  }
  return fullTheme as Required<Pick<Theme, 'darkColors' | 'hcColors' | 'hcDarkColors'>> & Theme
}
