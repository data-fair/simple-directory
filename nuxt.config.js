const URL = require('url').URL
const i18n = require('./i18n')
let config = require('config')
config.basePath = new URL(config.publicUrl + '/').pathname
config.i18nMessages = i18n.messages
config.i18nLocales = config.i18n.locales.join(',')
config.readonly = require('./server/storages').readonly()
config.publicOAuth = require('./server/utils/oauth').publicProviders

const fr = require('vuetify/es5/locale/fr').default

if (process.env.NODE_ENV === 'production') {
  const nuxtConfigInject = require('@koumoul/nuxt-config-inject')
  if (process.argv.slice(-1)[0] === 'build') config = nuxtConfigInject.prepare(config)
  else nuxtConfigInject.replace(config, ['nuxt-dist/**/*', 'public/static/**/*'])
}

const webpack = require('webpack')

module.exports = {
  ssr: false,
  components: true,
  srcDir: 'public/',
  buildDir: 'nuxt-dist',
  build: {
    transpile: [/@koumoul/],
    publicPath: config.publicUrl + '/_nuxt/',
    extend (config, { isServer, isDev, isClient }) {
      // config.optimization.minimize = false
      // Ignore all locale files of moment.js, those we want are loaded in plugins/moment.js
      config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))
    },
  },
  loading: { color: '#1e88e5' }, // Customize the progress bar color
  plugins: [
    { src: '~plugins/session', ssr: false },
    { src: '~plugins/query-params', ssr: false },
    { src: '~plugins/vuetify' },
    { src: '~plugins/moment' },
    { src: '~plugins/axios' },
    { src: '~plugins/analytics', ssr: false },
    { src: '~plugins/iframe-resizer', ssr: false },
  ],
  router: {
    base: config.basePath,
  },
  modules: ['@nuxtjs/markdownit', '@nuxtjs/axios', 'cookie-universal-nuxt', ['nuxt-i18n', {
    seo: false,
    // cannot come from config as it must be defined at build time (routes are impacted
    // we will override some of it at runtime using env.i18n
    locales: i18n.locales,
    defaultLocale: i18n.defaultLocale,
    vueI18n: {
      fallbackLocale: i18n.defaultLocale,
      messages: config.i18nMessages,
    },
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_lang',
    },
  }]],
  buildModules: ['@nuxtjs/vuetify'],
  axios: {
    browserBaseURL: config.basePath,
  },
  vuetify: {
    theme: {
      dark: config.theme.dark,
      themes: {
        light: config.theme.colors,
        dark: { ...config.theme.colors, ...config.theme.darkColors },
      },
    },
    defaultAssets: {
      font: {
        family: 'Nunito',
      },
    },
    lang: {
      locales: { fr },
      current: 'fr',
    },
  },
  env: {
    mainPublicUrl: config.publicUrl,
    basePath: config.basePath,
    theme: config.theme,
    homePage: config.homePage,
    maildev: config.maildev,
    defaultMaxCreatedOrgs: config.quotas.defaultMaxCreatedOrgs,
    readonly: config.readonly,
    analytics: config.analytics,
    onlyCreateInvited: config.onlyCreateInvited,
    userSelfDelete: config.userSelfDelete,
    tosUrl: config.tosUrl,
    manageDepartments: config.manageDepartments,
    manageDepartmentLabel: config.manageDepartmentLabel,
    passwordless: config.passwordless,
    i18nLocales: config.i18nLocales,
    oauth: config.publicOAuth,
    anonymousContactForm: config.anonymousContactForm,
    noBirthday: config.noBirthday,
    showCreatedUserHost: config.showCreatedUserHost,
    avatars: config.avatars,
    perOrgStorageTypes: config.perOrgStorageTypes,
  },
  head: {
    title: config.i18nMessages[i18n.defaultLocale].root.title,
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'application', name: 'application-name', content: i18n.messages[i18n.defaultLocale].root.title },
      { hid: 'description', name: 'description', content: i18n.messages[i18n.defaultLocale].root.description },
    ],
    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Nunito:300,400,500,700,400italic' },
      // /favicon.ico is not put un config/default.js to prevent a nuxt-config-inject bug
      { rel: 'icon', type: 'image/x-icon', href: config.theme.favicon || '/favicon.ico' },
    ],
    style: [],
  },
}

if (config.theme.cssUrl) {
  module.exports.head.link.push({ rel: 'stylesheet', href: config.theme.cssUrl })
}

if (config.theme.cssText) {
  module.exports.head.style.push({ type: 'text/css', cssText: config.theme.cssText })
}
