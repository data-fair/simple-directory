<template>
  <v-row
    v-if="authProviders"
    class="mb-6 mx-0"
  >
    <v-btn
      v-for="authProvider of authProviders"
      :key="authProvider.type + ':' + authProvider.id"
      :color="authProvider.color"
      :href="`${env.publicUrl}/api/auth/${authProvider.type}/${authProvider.id}/login${redirectParam}`"
      dark
      small
      rounded
      depressed
      class="pl-1 pr-3 mr-2 text-none"
    >
      <v-icon>{{ authProvider.icon }}</v-icon>
      &nbsp;{{ authProvider.title }}
    </v-btn>
  </v-row>
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['redirect'],
  computed: {
    ...mapState(['env', 'authProviders']),
    redirectParam () {
      if (!this.redirect) return ''
      return `?redirect=${encodeURIComponent(this.redirect)}`
    }
  },
  created () {
    this.$store.dispatch('fetchAuthProviders')
  }
}
</script>

<style lang="css" scoped>
</style>
