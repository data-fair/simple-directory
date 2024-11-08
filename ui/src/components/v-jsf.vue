<template lang="html">
  <v-jsf-original
    :value="value"
    :schema="schema"
    :options="vjsfOptions"
    @input="val => $emit('input', val)"
    @change="$emit('change')"
  />
</template>

<script setup lang="ts">
import VJsfOriginal from '@koumoul/vjsf/lib/VJsf.js'
import '@koumoul/vjsf/lib/deps/third-party.js'
import '@koumoul/vjsf/dist/main.css'

export default {
  components: {
    VJsfOriginal
  },
  props: {
    value: { type: Object, default: null },
    options: { type: Object, default: null },
    schema: { type: Object, required: true }
  },
  computed: {
    vjsfOptions () {
      return { ...this.options }
    }
  }

}
</script>

<style>
</style>
