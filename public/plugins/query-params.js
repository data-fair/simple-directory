// Some query parameters must be kept when navigating

const persistentParams = ['embed', 'showNav']

export default ({app}) => {
  app.router.beforeEach((to, from, next) => {
    let persistedParam = false
    persistentParams.forEach(param => {
      if (from.query[param] && !to.query[param]) {
        to.query[param] = from.query[param]
        persistedParam = true
      }
    })
    if (persistedParam) next({...to})
    else next()
  })
}
