<template>
  <v-container>
    <v-row
      align="center"
      justify="center"
      class="py-3"
    >
      <v-alert type="error">
        {{ error.message || error.statusCode || error }}
      </v-alert>
    </v-row>
  </v-container>
</template>

<script>
export default {
  props: ['error']
}
</script>
