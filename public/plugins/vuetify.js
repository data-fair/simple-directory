import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

export default ({store}) => {
  if (store.state.env.brand) {
    Vue.use(Vuetify, {
      theme: store.state.env.brand.theme
    })
  } else {
    Vue.use(Vuetify)
  }
}
