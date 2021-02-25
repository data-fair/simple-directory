const { Nuxt } = require('nuxt')
const { createProxyMiddleware } = require('http-proxy-middleware')
const nuxtConfig = require('../nuxt.config.js')

module.exports = async () => {
  if (['development', 'test'].includes(process.env.NODE_ENV)) {
    // in dev mode the nuxt dev server is already running, we re-expose it
    return createProxyMiddleware({ target: 'http://localhost:3000' })
  } else {
    // Prepare nuxt for rendering and serving UI
    const nuxt = new Nuxt(nuxtConfig)
    return async (req, res, next) => {
      // re-apply the prefix that was removed by our reverse proxy in prod configs
      req.url = (nuxtConfig.router.base + req.url).replace('//', '/')
      nuxt.render(req, res)
    }
  }
}
