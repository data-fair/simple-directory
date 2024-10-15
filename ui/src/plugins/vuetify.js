export default async ({ app, route, $vuetify, store }) => {
  const sitePublic = store.state.sitePublic
  const customPrimary = (sitePublic && sitePublic.theme.primaryColor) || (route.query && route.query.primary)
  if (app.$cookies.get('theme_dark') !== undefined) $vuetify.theme.dark = ['true', true].includes(app.$cookies.get('theme_dark'))
  if (route.query.dark) $vuetify.theme.dark = route.query.dark === 'true'
  if (customPrimary) {
    store.state.style.customPrimaryColor = customPrimary
    $vuetify.theme.themes.light.primary = store.getters.readablePrimaryColor
    $vuetify.theme.themes.dark.primary = $vuetify.theme.themes.light.primary
  }
}
