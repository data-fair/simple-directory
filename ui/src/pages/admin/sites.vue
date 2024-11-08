<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h6 mb-3">
        {{ $t('common.sites') }} <span v-if="sites">({{ $n(sites.count) }})</span>
        <site-post @created="fetchSites" />
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
      :items-per-page="10000"
    >
      <template #item="props">
        <tr>
          <td v-if="props.item.logo">
            <img
              style="max-height: 100%"
              :src="props.item.logo"
            >
          </td>
          <td
            v-else
            :style="`min-width:50px;background-color:${props.item.theme.primaryColor}`"
          />
          <td>
            <a
              :href="`http://${props.item.host}`"
              target="blank"
            >{{ props.item.host }}</a>
          </td>
          <td>{{ props.item._id }}</td>
          <td>{{ props.item.owner.name }}</td>
          <td>{{ props.item.authMode }}</td>
          <td>
            <v-btn
              v-for="authProvider of (props.item.authProviders || [])"
              :key="authProvider.type + ':' + authProvider.id"
              :color="contrastColor(authProvider.color)"
              dark
              size="small"
              rounded
              variant="flat"
              class="pl-0 pr-3 mr-2 mb-1 text-none text-white"
              style="cursor:default"
            >
              <v-avatar
                size="27"
                color="white"
                class="elevation-4"
                style="left:-1px; top: -1px;"
              >
                <v-icon
                  v-if="authProvider.icon"
                  :color="contrastColor(authProvider.color)"
                >
                  {{ authProvider.icon }}
                </v-icon>
                <img
                  v-else-if="authProvider.img"
                  :src="authProvider.img"
                  :alt="authProvider.title"
                >
              </v-avatar>
              &nbsp;{{ authProvider.title }}
            </v-btn>
          </td>
          <td>
            <site-patch
              :site="props.item"
              :sites="sites.results"
              @change="fetchSites"
            />
            <confirm-menu
              yes-color="warning"
              @confirm="deleteSite(props.item)"
            >
              <template #activator="{on, attrs}">
                <v-btn
                  :title="$t('common.delete')"
                  v-bind="attrs"
                  variant="text"
                  icon
                  color="warning"
                  v-on="on"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </confirm-menu>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup lang="ts">
import { mapState, mapGetters, mapActions } from 'vuex'
import eventBus from '../../event-bus'
export default {
  data: () => ({
    sites: null,
    loading: false,
    headers: null
  }),
  computed: {
    ...mapState(['env']),
    ...mapState('session', ['user']),
    ...mapGetters(['contrastColor'])
  },
  async created () {
    if (!this.user.adminMode) return uiNotif.sendUiNotif({error:this.$t('errors.permissionDenied') })
    this.fetchSites()
    this.headers = []
    // if (this.$uiConfig.avatars.orgs) this.headers.push({ text: '', sortable: false })
    this.headers = this.headers.concat([
      { text: '', value: 'theme.primaryColor', sortable: false },
      { text: this.$t('common.host'), value: 'host' },
      { text: this.$t('common.id'), value: '_id', sortable: false },
      { text: this.$t('common.organization'), value: 'owner', sortable: false },
      { text: this.$t('common.authMode'), value: 'authMode', sortable: false },
      { text: this.$t('common.authProviders'), value: 'authProviders', sortable: false },
      { test: '', sortable: false }
    ])
  },
  methods: {
    ...mapActions(['deleteSite']),
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
    },
    async deleteSite (site) {
      this.loading = true
      try {
        await this.$axios.$delete(`api/sites/${site._id}`)
        this.fetchSites()
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style lang="css">
</style>
