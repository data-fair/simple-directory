<template>
  <v-row>
    <v-btn
      v-for="oauth of env.oauth"
      :key="oauth.id"
      :color="oauth.color"
      :href="`${env.publicUrl}/api/auth/oauth/${oauth.id}/login${redirectParam}`"
      dark
      small
      rounded
      depressed
      class="pl-1 text-none pr-3 mx-1"
    >
      <v-icon>{{ oauth.icon }}</v-icon>
      &nbsp;&nbsp;{{ oauth.title }}
    </v-btn>
  </v-row>
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    props: ['redirect'],
    computed: {
      ...mapState(['env']),
      redirectParam() {
        if (!this.redirect) return ''
        return `?redirect=${encodeURIComponent(this.redirect)}`
      },
    },
  }
</script>

<style lang="css" scoped>
</style>
