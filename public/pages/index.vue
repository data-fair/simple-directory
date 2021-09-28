<template>
  <v-responsive class="index" data-iframe-height>
    <v-container class="fill-height">
      <v-row align="center">
        <v-col class="text-center">
          <img
            v-if="env.theme.logo"
            :src="env.theme.logo"
            class="logo"
          >
          <logo v-else class="logo" />

          <h3 class="text-h2">
            {{ $t('root.title') }}
          </h3>

          <v-divider class="my-3" />

          <span class="subheading">{{ $t('root.description') }}</span>
        </v-col>
      </v-row>
    </v-container>
  </v-responsive>
</template>

<script>
  import logo from '../components/logo.vue'
  const { mapState } = require('vuex')

  export default {
    components: { logo },
    computed: {
      ...mapState(['env']),
    },
  }
</script>

<style>
.index .logo {
  max-width: 150px;
}
</style>
