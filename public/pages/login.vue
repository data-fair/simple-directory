<template>
  <v-layout row justify-space-around>
    <v-flex xs12 sm8 md6 lg4 xl3>
      <v-card>
        <v-card-title primary-title>
          <h3 class="headline mb-0">{{ $t('pages.login.title') }}</h3>
          <div class="login-logo-container elevation-2">
            <img v-if="env.brand.logo" :src="env.brand.logo">
            <logo v-else/>
          </div>
        </v-card-title>
        <v-card-text>
          <h4 class="subheading">{{ $t('pages.login.emailTitle') }}</h4>
          <v-text-field
            id="email"
            :autofocus="true"
            :label="$t('pages.login.emailLabel')"
            :append-icon-cb="login"
            v-model="email"
            :error-messages="emailErrors"
            name="email"
            append-icon="send"
            @keyboard.enter.native="login"
          />
          <p class="caption" v-html="$t('pages.login.emailCaption')"/>
        </v-card-text>
      </v-card>
    </v-flex>
  </v-layout>

</template>

<script>
import logo from '../components/logo.vue'
import eventBus from '../event-bus'
const {mapState} = require('vuex')

export default {
  components: {logo},
  data: () => ({
    dialog: true,
    email: null,
    emailErrors: []
  }),
  computed: {
    ...mapState(['user', 'env']),
    redirectUrl() {
      return this.$route.query && this.$route.query.redirect
    }
  },
  methods: {
    async login() {
      try {
        await this.$axios.$post('api/v1/auth/passwordless' + (this.redirectUrl ? '?redirect=' + this.redirectUrl : ''), {
          email: this.email
        })
        this.emailErrors = []
        eventBus.$emit('notification', {type: 'success', msg: this.$t('pages.login.success')})
      } catch (error) {
        if (error.response.status >= 500) eventBus.$emit('notification', {error})
        else this.emailErrors = [error.response.data || error.message]
      }
    }
  }
}
</script>

<style lang="less">
  .login-logo-container {
    position: absolute;
    right: -20px;
    top: -20px;
    width: 80px;
    height: 80px;
    border-radius: 40px;
    background-color: white;
    padding: 8px;
  }
</style>
