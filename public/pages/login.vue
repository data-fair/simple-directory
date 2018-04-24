<template>
  <md-layout md-align="center">
    <md-layout md-column md-flex="30">
      <md-whiteframe style="padding:16px;margin-top:64px;">
        <md-input-container>
          <label>Email address</label>
          <md-input v-model="email" required/>
        </md-input-container>
        <md-input-container>
          <label>Redirect to</label>
          <md-input v-model="redirectUrl" required/>
        </md-input-container>
        <md-layout md-align="center">
          <md-button class="md-primary md-raised" type="submit" @click="login">Login</md-button>
        </md-layout>
      </md-whiteframe>
    </md-layout>
  </md-layout>
</template>

<script>
export default {
  name: 'Login',
  data: () => ({
    email: null
  }),
  computed: {
    redirectUrl() {
      return this.$route.query && this.$route.query.redirect
    }
  },
  methods: {
    async login() {
      await this.$axio.$post('api/auth/passwordless' + (this.redirectUrl ? '?redirect=' + this.redirectUrl : ''), {
        email: this.email
      })
    }
  }
}
</script>
