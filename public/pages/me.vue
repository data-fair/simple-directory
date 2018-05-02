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
  }
}
</script>

<style lang="css">
</style>
