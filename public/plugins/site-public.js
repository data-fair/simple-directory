export default async ({ app, route, $vuetify, store }) => {
  const sitePublic = await store.dispatch('fetchSitePublic')
  if (route.name === 'login' && sitePublic && sitePublic.authMode === 'onlyBackOffice') {
    const mainLoginUrl = new URL(window.location.href)
    mainLoginUrl.host = store.getters.mainHost
    window.location.replace(mainLoginUrl.href)
  }
}
