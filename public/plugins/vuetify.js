import tinycolor from 'tinycolor2'

const readableColor = (color) => {
  const c = tinycolor(color)
  const darkness = 1 - c.getLuminance()
  if (darkness > 0.7) return color
  return c.darken((0.7 - darkness) * 100).toString()
}

// while (!tinycolor.isReadable('#FFFFFF', c)) {
//   c.darken(2)
// }

export default ({ app, route, $vuetify }) => {
  if (app.$cookies.get('theme_dark') !== undefined) $vuetify.theme.dark = app.$cookies.get('theme_dark')
  if (route.query.dark) $vuetify.theme.dark = route.query.dark === 'true'
  if (route.query && route.query.primary) {
    // ensure the color will provide a readable contrast with white text in buttons
    const c = readableColor(route.query.primary)

    $vuetify.theme.themes.dark.primary = c
    $vuetify.theme.themes.light.primary = c
  }
}
