export default ({ app, route, $vuetify, store }) => {
  if (app.$cookies.get('theme_dark') !== undefined) $vuetify.theme.dark = app.$cookies.get('theme_dark') === 'true'
  if (route.query.dark) $vuetify.theme.dark = route.query.dark === 'true'
  if (route.query && route.query.primary) {
    store.state.style.customPrimaryColor = route.query.primary
    $vuetify.theme.themes.light.primary = store.getters.readablePrimaryColor
    $vuetify.theme.themes.dark.primary = $vuetify.theme.themes.light.primary
  }
}
