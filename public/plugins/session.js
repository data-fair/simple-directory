export default ({ store, app, env }) => {
  store.commit('setAny', { env: { ...env } })
  store.dispatch('session/init', {
    cookies: app.$cookies,
    directoryUrl: env.publicUrl,
  })
  store.dispatch('session/loop', app.$cookies)
}
