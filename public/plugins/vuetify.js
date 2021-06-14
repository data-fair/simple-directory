export default ({ app, route, $vuetify }) => {
  if (app.$cookies.get('theme_dark') !== undefined) $vuetify.theme.dark = app.$cookies.get('theme_dark')
  if (route.query.dark) $vuetify.theme.dark = route.query.dark === 'true'
  if (route.query && route.query.primary) {
    $vuetify.theme.themes.dark.primary = route.query.primary
    $vuetify.theme.themes.light.primary = route.query.primary
  }
}
