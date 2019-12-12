import Vue from 'vue'
import Vuex from 'vuex'
import { sessionStoreBuilder } from '@koumoul/sd-vue/src'
import eventBus from '../event-bus.js'

Vue.use(Vuex)

export default () => {
  return new Vuex.Store({
    modules: { session: sessionStoreBuilder() },
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
      async fetchUserDetails({ state, commit, dispatch }) {
        if (!state.session.user) return
        try {
          const userDetails = await this.$axios.$get(`api/users/${state.session.user.id}`)
          commit('setAny', { userDetails })
        } catch (error) {
          // User doesn't exist anymore or is disconnected
          if (error.response.status === 401 || error.response.status === 403) dispatch('session/logout')
          else eventBus.$emit('notification', { error })
        }
      },
      async patchOrganization({ dispatch }, { id, patch, msg }) {
        try {
          await this.$axios.$patch(`api/organizations/${id}`, patch)
          eventBus.$emit('notification', msg)
          dispatch('fetchUserDetails')
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      nuxtServerInit({ commit, dispatch }, { req, env, app }) {
        commit('setAny', { env: { ...env } })
        dispatch('session/init', { cookies: this.$cookies, baseUrl: env.publicUrl + '/api/session' })
      }
    }
  })
}
