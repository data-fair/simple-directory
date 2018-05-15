import Vue from 'vue'
import Vuex from 'vuex'
import {sessionStore} from 'simple-directory-client-nuxt'

Vue.use(Vuex)

export default () => {
  return new Vuex.Store({
    modules: {session: sessionStore},
    state: {
      userDetails: null,
      env: {}
    },
    mutations: {
      setAny(state, params) {
        Object.assign(state, params)
      }
    },
    actions: {
      async fetchUserDetails({state, commit}) {
        if (!state.session.user) return
        const userDetails = await this.$axios.$get(`api/users/${state.session.user.id}`)
        commit('setAny', {userDetails})
      },
      nuxtServerInit({commit, dispatch}, {req, env, app}) {
        commit('setAny', {
          env: { ...env, readonly: req.app.get('storage').readonly }
        })
        dispatch('session/init', {user: req.user, baseUrl: env.publicUrl + '/api/session'})
      }
    }
  })
}
