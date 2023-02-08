<template>
  <v-menu
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{on, attrs}">
      <v-btn
        icon
        v-bind="attrs"
        color="primary"
        class="mx-1"
        v-on="on"
      >
        <v-icon>mdi-bell</v-icon>
      </v-btn>
    </template>
    <v-card width="500">
      <v-iframe :src="notifySubscribeUrl" />
    </v-card>
  </v-menu>
</template>

<script>
import 'iframe-resizer/js/iframeResizer'
import VIframe from '@koumoul/v-iframe'

export default {
  components: { VIframe },
  props: ['topics', 'sender'],
  computed: {
    notifySubscribeUrl () {
      return `${process.env.notifyUrl}/embed/subscribe?key=${encodeURIComponent(this.topics.map(t => t.key).join(','))}&title=${encodeURIComponent(this.topics.map(t => t.title).join(','))}&sender=${encodeURIComponent(this.sender)}&register=false`
    }
  }
}
</script>

<style>

</style>
