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
      authProviders: null,
      sitePublic: null,
      sites: null
    },
    getters: {
      mainHost (state) {
        return new URL(state.env.mainPublicUrl).host
      },
      mainOrigin (state) {
        return new URL(state.env.mainPublicUrl).origin
      },
      host () {
        return window.location.host
      },
      redirects (state, getters) {
        if (!state.sites) return
        return [{ text: getters.mainHost, value: new URL(window.location.href).searchParams.get('redirect') || '' }]
          .concat(state.sites.results.map(site => ({ text: site.host, value: 'https://' + site.host + '/me/account' })))
      }
    },
    mutations: {
      setAny (state, params) {
        Object.assign(state, params)
      }
    },
    actions: {
      async fetchSitePublic ({ state, getters, commit }) {
        if (getters.mainHost === getters.host) return
        const sitePublic = await this.$axios.$get('/api/sites/_public')
        commit('setAny', { sitePublic })
        return sitePublic
      },
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
      },
      async patchSite (_, patch) {
        try {
          await this.$axios.$patch(`api/sites/${patch._id}`, patch)
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      async fetchSites ({ commit, state }) {
        if (state.sites) return
        try {
          const sites = await this.$axios.$get('api/sites')
          commit('setAny', { sites })
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      }
    }
  })
}
