export default ({ store, app, env, req }) => {
  store.commit('setAny', { env: { ...env } })
  store.dispatch('session/init', {
    cookies: app.$cookies,
    directoryUrl: env.basePath.slice(0, -1),
  })
  store.dispatch('session/loop', app.$cookies)
}
