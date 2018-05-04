<template lang="html">
  <v-layout column>
    Hey ! {{ user }}
  </v-layout>
</template>

<script>
import {mapState} from 'vuex'
export default {
  computed: {
    ...mapState(['user'])
  },
  mounted() {
    if (!this.user) this.$router.push(this.localePath('login'))
  }
}
</script>

<style lang="css">
</style>
