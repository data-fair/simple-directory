const config = require('config')
const URL = require('url').URL
const i18n = require('./i18n')

module.exports = {
  dev: process.env.NODE_ENV === 'development',
  srcDir: 'public/',
  build: {
    publicPath: config.publicUrl + '/_nuxt/',
    extractCSS: true,
    vendor: ['babel-polyfill'],
    // Use babel polyfill, not runtime transform to support Array.includes and other methods
    // cf https://github.com/nuxt/nuxt.js/issues/93
    babel: {
      presets: [
        ['vue-app', {useBuiltIns: true, targets: { ie: 11, uglify: true }}]
      ]
    }
  },
  loading: { color: '#1e88e5' }, // Customize the progress bar color
  plugins: [
    {src: '~plugins/vuetify'},
    {src: '~plugins/moment'},
    {src: '~plugins/axios'}
  ],
  router: {
    base: new URL(config.publicUrl).pathname
  },
  modules: ['@nuxtjs/markdownit', '@nuxtjs/axios', ['nuxt-i18n', {
    locales: i18n.locales,
    defaultLocale: config.defaultLocale,
    vueI18n: {
      fallbackLocale: config.defaultLocale,
      messages: i18n.messages
    }
  }]],
  axios: {
    browserBaseURL: config.publicUrl + '/',
    baseURL: `http://localhost:${config.port}/`
  },
  env: {
    publicUrl: config.publicUrl,
    brand: config.brand
  },
  head: {
    title: i18n.messages[config.defaultLocale].root.title,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'application', name: 'application-name', content: i18n.messages[config.defaultLocale].root.title },
      { hid: 'description', name: 'description', content: i18n.messages[config.defaultLocale].root.description }
    ],
    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Nunito:300,400,500,700,400italic|Material+Icons' }
    ]
  }
}
