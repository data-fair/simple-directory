module.exports = async () => {
  const { Nuxt } = require('nuxt-start')
  const nuxtConfig = require('../nuxt.config.js')

  // Prepare nuxt for rendering and serving UI
  nuxtConfig.dev = false
  const nuxt = new Nuxt(nuxtConfig)
  return {
    render: async (req, res, next) => {
      // accept buffering and caching of this response in the reverse proxy
      res.setHeader('X-Accel-Buffering', 'yes')

      // re-apply the prefix that was removed by our reverse proxy in prod configs
      req.url = (nuxtConfig.router.base + req.url).replace('//', '/')
      nuxt.render(req, res)
    },
    instance: nuxt
  }
}
