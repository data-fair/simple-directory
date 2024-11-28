<template>
  <v-menu
    :close-on-content-click="false"
    location="top"
  >
    <template #activator="{props}">
      <v-btn
        :icon="mdiBell"
        size="small"
        color="primary"
        class="mx-2"
        v-bind="props"
      >
        <v-icon :icon="mdiBell" />
      </v-btn>
    </template>
    <v-card width="500">
      <v-iframe :src="notifySubscribeUrl" />
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import 'iframe-resizer/js/iframeResizer'
// @ts-ignore
import VIframe from '@koumoul/v-iframe'

const { topics, sender } = defineProps({
  topics: { type: Array as () => { key: string, title: string }[], required: true },
  sender: { type: String, required: true }
})

const notifySubscribeUrl = computed(() => `${$sitePath}/notify/embed/subscribe?key=${encodeURIComponent(topics.map(t => t.key).join(','))}&title=${encodeURIComponent(topics.map(t => t.title).join(','))}&sender=${encodeURIComponent(sender)}&register=false`)
</script>

<style>

</style>
