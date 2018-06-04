import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

export default ({env}) => {
  Vue.use(Vuetify, {theme: env.theme.colors})
}
