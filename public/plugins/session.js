export default ({ store, app, env, req }) => {
  store.commit('setAny', { env: { ...env } })
  store.dispatch('session/init', {
    cookies: app.$cookies,
    directoryUrl: '', // will use browserBaseUrl from nuxt.config.js
  })
  store.dispatch('session/loop', app.$cookies)
}
