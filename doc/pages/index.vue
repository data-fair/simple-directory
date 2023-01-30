<template>
  <v-container class="fill-height">
    <v-row align="center">
      <v-col class="text-center">
        <img
          src="~/assets/logo.svg"
          style="max-width: 150px;"
        >
        <h3 class="text-h2">
          {{ $t("root.title") }}
        </h3>
        <span class="subheading">{{ $t("root.description") }}</span>
        <v-divider class="my-3" />
        <v-btn
          large
          text
          color="primary"
          href="https://github.com/data-fair/simple-directory"
        >
          Github
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {}
</script>
