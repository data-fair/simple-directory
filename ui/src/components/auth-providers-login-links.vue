<template>
  <v-row
    v-if="authProviders"
    class="mb-6 mx-0"
  >
    <v-btn
      v-if="sitePublic && sitePublic.authMode === 'ssoBackOffice'"
      :color="$uiConfig.theme.colors.primary"
      :href="mainSiteLoginUrl"
      dark
      size="small"
      rounded
      variant="flat"
      class="pl-0 pr-3 mr-2 mb-1 text-none text-white"
    >
      <v-avatar
        size="28"
        color="white"
        class="elevation-1"
        style="left:-1px"
      >
        <img
          v-if="$uiConfig.theme.logo"
          :src="$uiConfig.theme.logo"
        >
        <logo v-else />
      </v-avatar>
      &nbsp;{{ mainHost }}
    </v-btn>
    <v-btn
      v-for="authProvider of authProviders.filter(p => !p.redirectMode || p.redirectMode.type === 'button')"
      :key="authProvider.type + ':' + authProvider.id"
      :color="contrastColor(authProvider.color)"
      :href="loginURL(authProvider)"
      dark
      size="small"
      rounded
      variant="flat"
      class="pl-0 pr-3 mr-2 mb-1 text-none text-white"
    >
      <v-avatar
        size="27"
        color="white"
        class="elevation-4"
        style="left:-1px; top: -1px;"
      >
        <v-icon
          v-if="authProvider.icon"
          :color="contrastColor(authProvider.color)"
        >
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
  props: ['redirect', 'email', 'invitToken', 'adminMode'],
  computed: {
    ...mapState(['env', 'authProviders', 'sitePublic']),
    ...mapGetters(['mainHost']),
    redirectParam () {
      if (!this.redirect) return ''
      return `?redirect=${encodeURIComponent(this.redirect)}`
    },
    ...mapGetters(['contrastColor', 'host', 'mainHost']),
    mainSiteLoginUrl () {
      return this.siteLoginUrl(this.mainHost)
    }
  },
  watch: {
    authProviders: {
      handler () {
        const alwaysRedirectProvider = this.authProviders?.find(p => p.redirectMode?.type === 'always')
        if (alwaysRedirectProvider) {
          window.location.href = this.loginURL(alwaysRedirectProvider)
        }
      },
      immediate: true
    }
  },
  methods: {
    loginURL (authProvider) {
      if (authProvider.type === 'otherSite') {
        return this.siteLoginUrl(authProvider.host)
      }
      let sdUrl = this.$uiConfig.publicUrl
      if (authProvider.type === 'otherSiteProvider') {
        sdUrl = `${authProvider.host.startsWith('localhost:') ? 'http' : 'https'}://${authProvider.host}/simple-directory`
      }
      const url = new URL(`${sdUrl}/api/auth/${authProvider.type}/${authProvider.id}/login`)
      if (this.redirect) url.searchParams.append('redirect', this.redirect)
      if (this.email) url.searchParams.append('email', this.email)
      if (this.invitToken) url.searchParams.append('invit_token', this.invitToken)
      if (this.adminMode) url.searchParams.append('adminMode', 'true')
      return url.href
    },
    siteLoginUrl (host) {
      const url = new URL(`${host.startsWith('localhost:') ? 'http' : 'https'}://${host}/simple-directory/login`)
      if (this.redirect) url.searchParams.append('redirect', this.redirect)
      if (this.email) url.searchParams.append('email', this.email)
      if (this.invitToken) url.searchParams.append('invit_token', this.invitToken)
      if (this.adminMode) url.searchParams.append('adminMode', 'true')
      return url.href
    }
  }
}
</script>

<style lang="css" scoped>
</style>
