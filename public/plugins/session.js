export default ({ store, app, env, req }) => {
  let publicUrl = window.location.origin + env.basePath
  if (publicUrl.endsWith('/')) publicUrl = publicUrl.substr(0, publicUrl.length - 1)
  store.commit('setAny', {
    env: {
      ...env,
      // reconstruct this env var that we used to have but lost when implementing multi-domain exposition
      publicUrl,
    },
  })
  store.dispatch('session/init', {
    cookies: app.$cookies,
    directoryUrl: publicUrl,
  })
  store.dispatch('session/loop', app.$cookies)
}
