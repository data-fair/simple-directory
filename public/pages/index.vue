<template>
  <v-jumbotron>
    <v-container fill-height>
      <v-layout align-center>
        <v-flex text-xs-center>
          <img src="../../public/assets/logo.svg" style="max-width: 150px;">
          <h3 class="display-3">{{ $t('common.title') }}</h3>
          <span class="subheading">{{ $t('common.description') }}</span>
          <v-divider class="my-3"/>
          <v-btn :to="localePath('login')" color="primary">{{ $t('common.logLink') }}</v-btn>
        </v-flex>
      </v-layout>
    </v-container>
  </v-jumbotron>
</template>

<script>
export default {}
</script>
