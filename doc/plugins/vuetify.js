import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

export default () => {
  Vue.use(Vuetify, {
    theme: process.env.brand.theme
  })
}
