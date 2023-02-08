<template>
  <v-row
    v-if="authProviders"
    class="mb-6 mx-0"
  >
    <v-btn
      v-for="authProvider of authProviders"
      :key="authProvider.type + ':' + authProvider.id"
      :color="contrastColor(authProvider.color)"
      :href="loginURL(authProvider)"
      dark
      small
      rounded
      depressed
      class="pl-0 pr-3 mr-2 mb-1 text-none white--text"
    >
      <v-avatar size="28">
        <v-icon v-if="authProvider.icon">
          {{ authProvider.icon }}
        </v-icon>
        <img
          v-else-if="authProvider.img"
          :src="authProvider.img"
          :alt="authProvider.title"
        >
      </v-avatar>
      &nbsp;{{ authProvider.title }}
    </v-btn>
  </v-row>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  props: ['redirect', 'email', 'invitToken'],
  computed: {
    ...mapState(['env', 'authProviders']),

    redirectParam () {
      if (!this.redirect) return ''
      return `?redirect=${encodeURIComponent(this.redirect)}`
    },
    ...mapGetters(['contrastColor'])
  },
  created () {
    this.$store.dispatch('fetchAuthProviders')
  },
  methods: {
    loginURL (authProvider) {
      const url = new URL(`${this.env.publicUrl}/api/auth/${authProvider.type}/${authProvider.id}/login`)
      if (this.redirect) url.searchParams.append('redirect', this.redirect)
      if (this.email) url.searchParams.append('email', this.email)
      if (this.invitToken) url.searchParams.append('invit_token', this.invitToken)
      return url.href
    }
  }
}
</script>

<style lang="css" scoped>
</style>
