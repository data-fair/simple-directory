<template lang="html">
  <v-speed-dial
    v-if="locales.length > 1"
    direction="bottom"
    transition="fade-transition"
  >
    <v-btn
      slot="activator"
      fab
      depressed
      small
    >
      {{ $i18n.locale }}
    </v-btn>
    <v-btn
      v-for="locale in locales.filter(l => l !== $i18n.locale)"
      :key="locale"
      :to="switchLocalePath(locale)"
      fab
      elevation="1"
      small
      nuxt
    >
      {{ locale }}
    </v-btn>
  </v-speed-dial>
</template>

<script>
import { mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['env']),
    locales () {
      return this.env.i18nLocales.split(',').filter(l => !!this.$i18n.locales.find(loc => loc.code === l))
    }
  }
}
</script>

<style lang="css">
</style>
