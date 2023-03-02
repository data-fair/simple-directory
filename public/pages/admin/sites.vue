<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h6 mb-3">
        {{ $t('common.sites') }} <span v-if="sites">({{ $n(sites.count) }})</span>
      </h2>
    </v-row>

    <v-data-table
      v-if="sites"
      :headers="headers"
      :items="sites.results"
      :loading="loading"
      class="elevation-1"
      item-key="id"
      hide-default-footer
    >
      <tr
        slot="item"
        slot-scope="props"
      >
        <td v-if="env.avatars.orgs">
          <v-avatar :size="40">
            <!-- TODO: site logo
              <img :src="env.publicUrl + '/api/avatars/organization/' + props.item.id + '/avatar.png'">-->
          </v-avatar>
        </td>
        <td>{{ props.item.host }}</td>
        <td>{{ props.item._id }}</td>
      </tr>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import eventBus from '../../event-bus'
export default {
  data: () => ({
    sites: null,
    loading: false,
    headers: null
  }),
  computed: {
    ...mapState(['env']),
    ...mapState('session', ['user'])
  },
  async created () {
    if (!this.user.adminMode) return this.$nuxt.error({ message: this.$t('errors.permissionDenied') })
    this.fetchSites()
    this.headers = []
    if (this.env.avatars.orgs) this.headers.push({ text: '', sortable: false })
    this.headers = this.headers.concat([
      { text: this.$t('common.host'), value: 'host' },
      { text: this.$t('common.id'), value: '_id', sortable: false }
    ])
  },
  methods: {
    async fetchSites () {
      this.loading = true
      try {
        this.sites = await this.$axios.$get('api/sites', {
          params: { showAll: true }
        })
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
