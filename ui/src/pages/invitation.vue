<template>
  <v-jumbotron
    class="index"
    data-iframe-height
  >
    <v-container class="fill-height">
      <v-row align="center">
        <v-col class="text-center">
          <h3 class="text-h2">
            {{ $t('pages.invitation.title') }}
          </h3>

          <v-divider class="my-3" />

          <span
            v-if="sameUser"
            class="subheading"
            v-html="$t('pages.invitation.msgSameUser', {profileUrl: $uiConfig.publicUrl + '/me'})"
          />
          <span
            v-else
            class="subheading"
            v-html="$t('pages.invitation.msgDifferentUser', {loginUrl: $uiConfig.publicUrl + '/login?email=' + encodeURIComponent($route.query.email)})"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-jumbotron>
</template>

<script>
const { mapState } = require('vuex')

export default {
  computed: {
    ...mapState('session', ['user']),
    ...mapState(['env']),
    sameUser () {
      return this.user && this.$route.query && (this.user.email === this.$route.query.email)
    }
  },
  async mounted () {
    if (this.sameUser) {
      await this.$axios.$post('api/session/keepalive')
    }
  }
}
</script>

<style>
.index .logo {
  max-width: 150px;
}
</style>
