import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'

export default ({store}) => {
  if (store.state.env.theme) {
    Vue.use(Vuetify, {
      theme: store.state.env.theme.colors
    })
  } else {
    Vue.use(Vuetify)
  }
}
