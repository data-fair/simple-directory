import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default () => {
  return new Vuex.Store({
    state: {
      user: null,
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
        if (!state.user) return
        const userDetails = await this.$axios.$get(`api/users/${state.user.id}`)
        commit('setAny', {userDetails})
      },
      login({state}) {
        const path = this.$router.currentRoute.path
        window.location.href = `${state.env.publicUrl}/api/session/login?redirect=${state.env.publicUrl}${path}?id_token=`
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
