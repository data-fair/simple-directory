import Vue from 'vue'
import Vuex from 'vuex'
import {sessionStore} from 'simple-directory-client-nuxt'
import eventBus from '../event-bus.js'

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
      async fetchUserDetails({state, commit, dispatch}) {
        if (!state.session.user) return
        try {
          const userDetails = await this.$axios.$get(`api/users/${state.session.user.id}`)
          commit('setAny', {userDetails})
        } catch (error) {
          // User doesn't exist anymore or is disconnected
          if (error.response.status === 401 || error.response.status === 403) dispatch('session/logout')
          else eventBus.$emit('notification', {error})
        }
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
