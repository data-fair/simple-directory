import Vue from 'vue'
import VueMultianalytics from '@koumoul/vue-multianalytics/src'

export default ({ store, env, app }) => {
  Vue.use(VueMultianalytics, { modules: $uiConfig.analytics, routing: { vueRouter: app.router, preferredProperty: 'fullPath' } })
}
