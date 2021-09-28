import tinycolor from 'tinycolor2'

export default ({ app, route, $vuetify }) => {
  if (app.$cookies.get('theme_dark') !== undefined) $vuetify.theme.dark = app.$cookies.get('theme_dark')
  if (route.query.dark) $vuetify.theme.dark = route.query.dark === 'true'
  if (route.query && route.query.primary) {
    // ensure the color will provide a readable contrast with white text in buttons
    const c = tinycolor(route.query.primary)
    while (!tinycolor.isReadable('#FFFFFF', c)) {
      c.darken(2)
    }
    $vuetify.theme.themes.dark.primary = route.query.primary
    $vuetify.theme.themes.light.primary = route.query.primary
  }
}
