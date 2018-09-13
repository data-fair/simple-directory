<template>
  <v-jumbotron class="index">
    <v-container fill-height>
      <v-layout align-center>
        <v-flex text-xs-center>
          <h3 class="display-3">{{ $t('pages.invitation.title') }}</h3>

          <v-divider class="my-3"/>

          <span v-if="sameUser" class="subheading" v-html="$t('pages.invitation.msgSameUser', {profileUrl: env.publicUrl + '/me'})" />
          <span v-else class="subheading" v-html="$t('pages.invitation.msgDifferentUser', {loginUrl: env.publicUrl + '/login?email=' + encodeURIComponent($route.query.email)})" />
        </v-flex>
      </v-layout>
    </v-container>
  </v-jumbotron>
</template>

<script>
import logo from '../components/logo.vue'
const {mapState} = require('vuex')

export default {
  components: {logo},
  computed: {
    ...mapState('session', ['user']),
    ...mapState(['env']),
    sameUser() {
      return this.user && this.$route.query && (this.user.email === this.$route.query.email)
    }
  },
  async mounted() {
    if (this.sameUser) {
      await this.$axios.$post(`api/session/keepalive`)
    }
  }
}
</script>

<style lang="less">
.index {
  .logo {
    max-width: 150px;
  }
}
</style>
