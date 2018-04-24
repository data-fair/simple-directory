<template>
  <v-jumbotron height="auto">
    <v-container fill-height>
      <v-layout align-center>
        <v-flex text-xs-center>
          <img src="../../public/assets/logo.svg" style="max-width: 150px;">
          <h3 class="display-3">{{ $t("doc.index.title") }}</h3>
          <span class="subheading">{{ $t("doc.index.subtitle") }}</span>
          <v-divider class="my-3"/>
          <v-btn large flat color="primary" href="https://github.com/koumoul-dev/simple-directory">Github</v-btn>
        </v-flex>
      </v-layout>
    </v-container>
  </v-jumbotron>
</template>

<script>
export default {}
</script>
