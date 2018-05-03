import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default () => {
  return new Vuex.Store({
    state: {
      user: null,
      env: {}
    },
    mutations: {
      setAny(state, params) {
        Object.assign(state, params)
      }
    },
    actions: {
      async login() {
        window.location.href = this.env.publicUrl + '/api/session/login'
      },
      async logout({commit}) {
        await this.$axios.post('api/session/logout')
        commit('setAny', {user: null})
        this.$router.push('/')
      },
      nuxtServerInit({commit, dispatch}, {req, env, app}) {
        commit('setAny', {
          user: req.user,
          env: { ...env, readonly: req.app.get('storage').readonly }
        })
      }
    }
  })
}
