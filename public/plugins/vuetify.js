import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
require('../stylus/main.styl')

export default ({ env, app, route }) => {
  if (app.$cookies.get('theme_dark') !== undefined) env.theme.dark = app.$cookies.get('theme_dark')
  if (route.query.dark) env.theme.dark = route.query.dark === 'true'

  Vue.use(Vuetify, {
    iconfont: 'mdi',
    theme: env.theme.dark ? { ...env.theme.colors, ...env.theme.darkColors } : env.theme.colors
  })
}
