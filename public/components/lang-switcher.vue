<template lang="html">
  <v-speed-dial
    v-if="env.i18n.locales.length > 1"
    direction="bottom"
    transition="fade-transition"
  >
    <v-btn slot="activator" fab depressed small>{{ $i18n.locale }}</v-btn>
    <v-btn v-for="locale in env.i18n.locales.filter(l => l !== $i18n.locale)" :key="locale" :to="switchLocalePath(locale)" fab small nuxt>
      {{ locale }}
    </v-btn>
  </v-speed-dial>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['env'])
  }
}
</script>

<style lang="css">
</style>
