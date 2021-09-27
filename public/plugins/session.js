export default ({ store, app, env, req }) => {
  store.commit('setAny', { env: { ...env } })
  console.log('basepath', env.basePath)
  console.log('directoryUrl', env.basePath.slice(0, -1))
  store.dispatch('session/init', {
    cookies: app.$cookies,
    directoryUrl: env.basePath.slice(0, -1),
  })
  store.dispatch('session/loop', app.$cookies)
}
