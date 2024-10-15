export default ({ store, app, env, req, route }) => {
  let publicUrl = window.location.origin + env.basePath
  if (publicUrl.endsWith('/')) publicUrl = publicUrl.substr(0, publicUrl.length - 1)
  let mainRedirect = route.query.main_redirect || route.query.mainRedirect
  if (!mainRedirect && route.query.redirect && route.query.redirect.startsWith(env.mainPublicUrl)) {
    mainRedirect = route.query.redirect
  }
  store.commit('setAny', {
    env: {
      ...env,
      // reconstruct this env var that we used to have but lost when implementing multi-domain exposition
      publicUrl,
      redirect: route.query.redirect || '',
      mainRedirect: mainRedirect || ''
    }
  })
  store.dispatch('session/init', {
    cookies: app.$cookies,
    directoryUrl: publicUrl
  })
  if (route.query.embed !== 'true') {
    // in case of iframe integration better to let the main page handle the session loop
    store.dispatch('session/loop', app.$cookies)
  }
}
