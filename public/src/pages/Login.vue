<template>
<md-layout md-align="center">
  <md-layout md-column md-flex="30">
    <md-whiteframe style="padding:16px;margin-top:64px;">
      <md-input-container>
        <label>Email address</label>
        <md-input required v-model="email"></md-input>
      </md-input-container>
      <md-input-container>
        <label>Redirect to</label>
        <md-input required v-model="redirectUrl"></md-input>
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
  name: 'login',
  data: () => ({
    redirectUrl: null,
    email: null
  }),
  mounted() {
    if (this.$route.query && this.$route.query.redirect) {
      this.redirectUrl = this.$route.query.redirect
    }
  },
  methods: {
    login() {
      this.$http.post(window.CONFIG.publicUrl + '/api/auth/passwordless' + (this.redirectUrl ? '?redirect=' + this.redirectUrl : ''), {
        email: this.email
      }).then(response => {
        window.location.href = response.data
      })
    }
  },
  watch: {
    redirectUrl(newVal) {
      if (newVal) {
        this.$router.push({
          query: {
            redirect: newVal
          }
        })
      } else {
        this.$router.push({
          query: {}
        })
      }
    }
  }
}
</script>
