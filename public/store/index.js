import Vue from 'vue'
import Vuex from 'vuex'
import { sessionStoreBuilder } from '@data-fair/sd-vue/src'
import eventBus from '../event-bus.js'
import style from './style'

Vue.use(Vuex)

export default () => {
  return new Vuex.Store({
    modules: {
      session: sessionStoreBuilder(),
      style: style()
    },
    state: {
      userDetails: null,
      env: {},
      authProviders: null
    },
    mutations: {
      setAny (state, params) {
        Object.assign(state, params)
      }
    },
    actions: {
      async fetchUserDetails ({ state, commit, dispatch }) {
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
      async patchOrganization ({ dispatch }, { id, patch, msg }) {
        try {
          await this.$axios.$patch(`api/organizations/${id}`, patch)
          eventBus.$emit('notification', msg)
          dispatch('fetchUserDetails')
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      async fetchAuthProviders ({ commit, state }) {
        if (state.authProviders) return
        try {
          const authProviders = await this.$axios.$get('api/auth/providers')
          commit('setAny', { authProviders })
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      }
    }
  })
}
