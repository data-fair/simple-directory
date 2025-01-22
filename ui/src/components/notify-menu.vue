<!-- eslint-disable vue/no-deprecated-slot-attribute -->
<template>
  <v-menu
    v-if="$uiConfig.useEvents"
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
      <d-frame
        :src="notifySubscribeUrl"
        resize
      >
        <div slot="loader">
          <v-skeleton-loader type="paragraph" />
        </div>
      </d-frame>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import '@data-fair/frame/lib/d-frame.js'

const { topics, sender } = defineProps({
  topics: { type: Array as () => { key: string, title: string }[], required: true },
  sender: { type: String, required: true }
})

const notifySubscribeUrl = computed(() => `${$sitePath}/events/embed/subscribe?key=${encodeURIComponent(topics.map(t => t.key).join(','))}&title=${encodeURIComponent(topics.map(t => t.title).join(','))}&sender=${encodeURIComponent(sender)}&register=false`)
</script>

<style>

</style>
