const fs = require('fs')
const config = require('config')
const messages = require('../i18n').messages

// Additional dynamic routes for generate
const routes = fs.readdirSync('doc/pages/doc/')
  .filter(f => f.endsWith('.md'))
  .map(f => {
    const [key, lang] = f.replace('.md', '').split('-')
    if (lang === 'fr') return `/doc/${key}`
    else return `/${lang}/doc/${key}`
  })

module.exports = {
  srcDir: 'doc/',
  build: { extractCSS: true },
  generate: {
    dir: 'doc-dist',
    routes,
  },
  loading: { color: '#1e88e5' }, // Customize the progress bar color
  plugins: [{ src: '~plugins/vuetify' }],
  router: { base: '/simple-directory/' },
  env: { theme: config.theme },
  modules: ['@nuxtjs/markdownit', ['nuxt-i18n', {
    locales: [
      { code: 'fr' },
      { code: 'en' },
    ],
    defaultLocale: 'fr',
    vueI18n: {
      fallbackLocale: 'fr',
      messages,
    },
  }]],
  head: {
    title: 'Simple Directory',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'application', name: 'application-name', content: 'Simple Directory' },
      { hid: 'description', name: 'description', content: 'Simple Directory - Documentation' },
    ],
    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Nunito:300,400,500,700,400italic|Material+Icons' },
      { rel: 'icon', type: 'image/x-icon', href: 'favicon.ico' },
    ],
  },
}
