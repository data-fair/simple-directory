<template>
  <v-row class="mb-6 mx-0">
    <v-btn
      v-for="oauth of env.oauth"
      :key="oauth.id"
      :color="oauth.color"
      :href="`${env.publicUrl}/api/auth/oauth/${oauth.id}/login${redirectParam}`"
      dark
      small
      rounded
      depressed
      class="pl-1 pr-3 mr-2 text-none"
    >
      <v-icon>{{ oauth.icon }}</v-icon>
      &nbsp;{{ oauth.title }}
    </v-btn>
  </v-row>
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['redirect'],
  computed: {
    ...mapState(['env']),
    redirectParam () {
      if (!this.redirect) return ''
      return `?redirect=${encodeURIComponent(this.redirect)}`
    }
  }
}
</script>

<style lang="css" scoped>
</style>
