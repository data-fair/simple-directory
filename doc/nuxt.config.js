const config = require('config')

module.exports = {
  srcDir: 'doc/',
  build: {extractCSS: true},
  generate: {dir: 'doc-dist'},
  loading: { color: '#1e88e5' }, // Customize the progress bar color
  plugins: [{src: '~plugins/vuetify'}],
  router: {base: '/simple-directory/'},
  env: {brand: config.brand},
  head: {
    title: 'Simple Directory',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'application', name: 'application-name', content: 'Simple Directory' },
      { hid: 'description', name: 'description', content: 'Simple Directory - Documentation' }
    ],
    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Nunito:300,400,500,700,400italic|Material+Icons' }
    ]
  }
}
