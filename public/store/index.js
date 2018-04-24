import Vue from 'vue'
import Vuex from 'vuex'
import jwtDecode from 'jwt-decode'
import Cookie from 'js-cookie'
const cookieparser = require('cookieparser')

Vue.use(Vuex)

export default () => {
  return new Vuex.Store({
    state: {
      user: null,
      env: {}
    },
    mutations: {
      setJwt(state, jwt) {
        this.$axios.setToken(jwt, 'Bearer')
        state.jwt = jwt
      },
      setUser(state, user) {
        if (user && user.roles && user.roles.includes('administrator')) user.isAdmin = true
        state.user = user
      },
      setAny(state, params) {
        Object.assign(state, params)
      }
    },
    actions: {
      logout(context) {
        context.commit('setJwt')
        Cookie.remove('id_token')
        context.commit('setUser')
        this.$router.push('/')
      },
      nuxtServerInit({commit, dispatch}, {req, env, app}) {
        commit('setAny', {env: {...env}})
        let accessToken = null
        if (req.headers.cookie) accessToken = cookieparser.parse(req.headers.cookie).id_token
        commit('setJwt', accessToken)
        if (accessToken) {
          const user = jwtDecode(accessToken)
          commit('setUser', user)
        }
      }
    }
  })
}
