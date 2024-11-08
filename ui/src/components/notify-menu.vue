<template>
  <v-menu
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        icon

        color="primary"
        class="mx-1"
        v-bind="props"
      >
        <v-icon>mdi-bell</v-icon>
      </v-btn>
    </template>
    <v-card width="500">
      <v-iframe :src="notifySubscribeUrl" />
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import 'iframe-resizer/js/iframeResizer'
import VIframe from '@koumoul/v-iframe'

export default {
  components: { VIframe },
  props: ['topics', 'sender'],
  computed: {
    notifySubscribeUrl () {
      return `${process.$uiConfig.notifyUrl}/embed/subscribe?key=${encodeURIComponent(this.topics.map(t => t.key).join(','))}&title=${encodeURIComponent(this.topics.map(t => t.title).join(','))}&sender=${encodeURIComponent(this.sender)}&register=false`
    }
  }
}
</script>

<style>

</style>
