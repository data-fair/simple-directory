<template>
  <v-responsive class="index" data-iframe-height>
    <v-container fill-height>
      <v-layout align-center>
        <v-flex text-xs-center>
          <img v-if="env.theme.logo" :src="env.theme.logo" class="logo">
          <logo v-else class="logo"/>

          <h3 class="display-3">{{ $t('root.title') }}</h3>

          <v-divider class="my-3"/>

          <span class="subheading">{{ $t('root.description') }}</span>
        </v-flex>
      </v-layout>
    </v-container>
  </v-responsive>
</template>

<script>
import logo from '../components/logo.vue'
const { mapState } = require('vuex')

export default {
  components: { logo },
  computed: {
    ...mapState(['env'])
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
