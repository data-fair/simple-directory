import '@mdi/font/css/materialdesignicons.css'
import Vue from 'vue'
import Vuetify from 'vuetify/lib'
require('../stylus/main.styl')

export default ({ env }) => {
  Vue.use(Vuetify, {
    iconfont: 'mdi',
    theme: env.theme.colors
  })
}
