<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h6 mb-3">
        {{ $t('common.oauthTokens') }} <span v-if="oauthTokens">({{ $n(oauthTokens.count) }})</span>
      </h2>
    </v-row>

    <v-data-table
      v-if="oauthTokens"
      :headers="headers"
      :items="oauthTokens.results"
      :loading="loading"
      class="elevation-1"
      item-key="id"
      hide-default-footer
      :items-per-page="10000"
    >
      <template #item="props">
        <tr>
          <td>
            {{ JSON.stringify(props.item) }}
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup lang="ts">
import { mapState, mapGetters } from 'vuex'
import eventBus from '../../event-bus'
export default {
  data: () => ({
    oauthTokens: null,
    loading: false,
    headers: null
  }),
  computed: {
    ...mapState(['env']),
    ...mapState('session', ['user']),
    ...mapGetters(['contrastColor'])
  },
  async created () {
    if (!this.user.adminMode) return uiNotif.sendUiNotif({ error: this.$t('errors.permissionDenied') })
    this.fetchOAuthTokens()
    this.headers = [
      { text: '', value: 'json', sortable: false }
    ]
  },
  methods: {
    async fetchOAuthTokens () {
      this.loading = true
      try {
        this.oauthTokens = await this.$axios.$get('api/oauth-tokens')
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
      this.loading = false
    }
  }
}
</script>

<style lang="css">
</style>
