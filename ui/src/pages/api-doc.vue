<template lang="html">
  <iframe
    :src="src"
    :height="height"
    width="100%"
  />
</template>

<script setup lang="ts">
export default {
  props: ['url'],
  computed: {
    height () {
      return Math.max(window.innerHeight, 1000)
    },
    src () {
      return 'https://koumoul.com/openapi-viewer/?proxy=false&hide-toolbar=true&url=' + encodeURIComponent(this.url)
    }
  }
}
</script>

<style lang="css">
iframe {
  background-color: transparent;
  border: none;
}
</style>
