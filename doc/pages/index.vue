<template>
  <v-jumbotron height="auto">
    <v-container class="fill-height">
      <v-row align="center">
        <v-col class="text-center">
          <img src="../../public/assets/logo.svg" style="max-width: 150px;">
          <h3 class="text-h2">
            {{ $t("root.title") }}
          </h3>
          <span class="subheading">{{ $t("root.description") }}</span>
          <v-divider class="my-3" />
          <v-btn
            large
            flat
            color="primary"
            href="https://github.com/koumoul-dev/simple-directory"
          >
            Github
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-jumbotron>
</template>

<script>
  export default {}
</script>
