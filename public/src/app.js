import Vue from 'vue'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.css'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'

import routes from './routes.js'

import App from './App.vue'

Vue.use(VueMaterial)
Vue.use(VueResource)
Vue.use(VueRouter)

Vue.material.registerTheme('default', {
  primary: {
    color: 'teal',
    hue: '500'
  },
  accent: {
    color: 'deep-orange',
    hue: '600'
  },
  warn: {
    color: 'orange',
    hue: '400'
  }
})

let base = window.CONFIG.publicUrl.split('//').pop().split('/')
base.shift()
base = base.join('/')

const router = new VueRouter({
  mode: 'history',
  routes,
  base,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return {
        x: 0,
        y: 0
      }
    }
  }
})

/* eslint-disable no-new */
new Vue({
  template: '<App />',
  router,
  components: {
    App
  }
}).$mount('#app')
