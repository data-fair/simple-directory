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

const targetURL = new URL(process.env.TARGET || 'http://localhost:3146/')

module.exports = {
  telemetry: false,
  ssr: true,
  srcDir: 'doc/',
  target: 'static',
  components: true,
  build: {
    extractCSS: true
  },
  generate: {
    dir: 'doc-dist',
    routes
  },
  loading: { color: '#1e88e5' }, // Customize the progress bar color
  router: { base: targetURL.pathname },
  env: {
    base: targetURL.pathname,
    theme: config.theme
  },
  modules: ['@nuxtjs/markdownit', '@nuxtjs/sitemap', ['nuxt-i18n', {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    vueI18n: {
      fallbackLocale: 'fr',
      messages
    }
  }]],
  sitemap: {
    hostname: targetURL.origin
  },
  buildModules: ['@nuxtjs/vuetify'],
  vuetify: {
    theme: {
      themes: {
        light: config.theme.colors
      }
    },
    defaultAssets: {
      font: {
        family: 'Nunito'
      }
    }
  },
  head: {
    title: 'Simple Directory - Documentation',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'application', name: 'application-name', content: 'Simple Directory' },
      { hid: 'description', name: 'description', content: 'Simple Directory - Documentation' }
    ],
    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Nunito:300,400,500,700,400italic|Material+Icons' },
      { rel: 'icon', type: 'image/x-icon', href: 'favicon.ico' }
    ]
  }
}
