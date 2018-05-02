<template lang="html">
  <v-speed-dial
    direction="bottom"
    transition="fade-transition"
  >
    <v-btn slot="activator" fab flat small>{{ $i18n.locale }}</v-btn>
    <v-btn v-for="locale in $i18n.locales.filter(l => l.code !== $i18n.locale)" :key="locale.code" :to="switchLocalePath(locale.code)" fab small nuxt>
      {{ locale.code }}
    </v-btn>
  </v-speed-dial>
</template>

<script>
export default {
}
</script>

<style lang="css">
</style>
