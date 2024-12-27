import { type Colors } from '#types/site-public/index.ts'

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
