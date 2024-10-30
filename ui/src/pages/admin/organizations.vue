<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h6 mb-3">
        {{ $t('common.organizations') }} <span v-if="organizations">({{ $n(organizations.count) }})</span>
      </h2>
    </v-row>

    <v-row class="mb-3 mx-0">
      <v-text-field
        v-model="q"
        :label="$t('common.search')"
        name="search"
        variant="solo"
        style="max-width:300px;"
        append-icon="mdi-magnify"
        @click:append="fetchOrganizations"
        @keyup.enter="fetchOrganizations"
      />
    </v-row>

    <v-data-table
      v-if="organizations"
      v-model:options="pagination"
      :headers="headers"
      :items="organizations.results"
      :server-items-length="pagination.totalItems"
      :loading="loading"
      class="elevation-1"
      item-key="id"
      :footer-props="{itemsPerPageOptions: [10, 25, 100], itemsPerPageText: ''}"
    >
      <template #item="props">
        <tr>
          <td v-if="$uiConfig.avatars.orgs">
            <v-avatar :size="40">
              <img :src="$sdUrl + '/api/avatars/organization/' + props.item.id + '/avatar.png'">
            </v-avatar>
          </td>
          <td>{{ props.item.name }}</td>
          <td>{{ props.item.id }}</td>
          <td>{{ props.item.description }}</td>
          <template v-if="!$uiConfig.readonly">
            <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
            <td>{{ props.item.updated && $d(new Date(props.item.updated.date)) }}</td>
            <td class="justify-center layout px-0">
              <v-btn
                :loading="!props.item.limits"
                :color="!props.item.limits ? 'default' : (props.item.limits.store_nb_members.consumption >= props.item.limits.store_nb_members.limit ? 'warning' : 'primary')"
                :dark="!!props.item.limits"
                size="small"
                rounded
                class="mt-2 text-lowercase"
                @click="currentOrganization = props.item;currentLimits = JSON.parse(JSON.stringify(props.item.limits));limitOrganizationDialog = true"
              >
                <template v-if="props.item.limits">
                  <template v-if="!props.item.limits.store_nb_members || !props.item.limits.store_nb_members.consumption">
                    {{ $t('common.missingInfo') }}
                  </template>
                  <template v-else-if="props.item.limits.store_nb_members.limit === 0">
                    {{ props.item.limits.store_nb_members.consumption.toLocaleString() }} {{ $t('pages.admin.organizations.members') }}
                  </template>
                  <template v-else>
                    {{ props.item.limits.store_nb_members.consumption.toLocaleString() }} / {{ props.item.limits.store_nb_members.limit.toLocaleString() }} {{ $t('pages.admin.organizations.members') }}
                  </template>
                </template>
              </v-btn>
              <v-btn
                :to="localePath({name: 'organization-id', params: {id: props.item.id}})"
                icon
                class="mx-0"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                class="mx-0"
                @click="currentOrganization = props.item;deleteOrganizationDialog = true"
              >
                <v-icon color="warning">
                  mdi-delete
                </v-icon>
              </v-btn>
            </td>
          </template>
          <template v-else>
            <td class="justify-center layout px-0">
              <v-btn
                :to="localePath({name: 'organization-id', params: {id: props.item.id}})"
                icon
                class="mx-0"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </td>
          </template>
        </tr>
      </template>
    </v-data-table>

    <v-dialog
      v-model="deleteOrganizationDialog"
      max-width="500px"
    >
      <v-card v-if="currentOrganization">
        <v-card-title class="text-h6">
          {{ $t('common.confirmDeleteTitle', {name: currentOrganization.name}) }}
        </v-card-title>
        <v-card-text>
          {{ $t('common.confirmDeleteMsg') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="deleteOrganizationDialog = false"
          >
            {{ $t('common.confirmCancel') }}
          </v-btn>
          <v-btn
            color="warning"
            @click="deleteOrganizationDialog = false;deleteOrganization(currentOrganization)"
          >
            {{ $t('common.confirmOk') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="limitOrganizationDialog"
      max-width="500px"
    >
      <v-card v-if="currentOrganization">
        <v-card-title class="text-h6">
          {{ $t('pages.admin.organizations.limitOrganizationTitle', {name: currentOrganization.name}) }}
        </v-card-title>
        <v-card-text v-if="currentLimits">
          <v-text-field
            v-model.number="currentLimits.store_nb_members.limit"
            :label="$t('pages.admin.organizations.nbMembers')"
            type="number"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="limitOrganizationDialog = false"
          >
            {{ $t('common.confirmCancel') }}
          </v-btn>
          <v-btn
            color="warning"
            @click="limitOrganizationDialog = false;saveLimits(currentOrganization, currentLimits)"
          >
            {{ $t('common.confirmOk') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import eventBus from '../../event-bus'
export default {
  data: () => ({
    organizations: null,
    currentOrganization: null,
    currentLimits: null,
    deleteOrganizationDialog: false,
    limitOrganizationDialog: false,
    q: '',
    pagination: { page: 1, itemsPerPage: 10, totalItems: 0, sortDesc: [false], sortBy: ['name'], multiSort: false, mustSort: true },
    loading: false,
    headers: null
  }),
  computed: {
    sort () {
      if (!this.pagination.sortBy.length) return ''
      return (this.pagination.sortDesc[0] ? '-' : '') + this.pagination.sortBy[0]
    },
    ...mapState(['env']),
    ...mapState('session', ['user'])
  },
  watch: {
    'pagination.page' () { this.fetchOrganizations() },
    'pagination.itemsPerPage' () { this.fetchOrganizations() },
    'pagination.sortBy' () { this.fetchOrganizations() },
    'pagination.sortDesc' () { this.fetchOrganizations() }
  },
  async created () {
    if (!this.user.adminMode) return uiNotif.sendUiNotif({ error: this.$t('errors.permissionDenied') })
    this.fetchOrganizations()
    this.headers = []
    if (this.$uiConfig.avatars.orgs) this.headers.push({ text: this.$t('common.avatar'), sortable: false })
    this.headers = this.headers.concat([
      { text: this.$t('common.name'), value: 'name' },
      { text: this.$t('common.id'), value: 'id', sortable: false },
      { text: this.$t('common.description'), value: 'description', sortable: false }
    ])
    if (!this.$uiConfig.readonly) {
      this.headers = this.headers.concat([
        { text: this.$t('common.createdAt'), value: 'created.date' },
        { text: this.$t('common.updatedAt'), value: 'updated.date' }
      ])
    }
    this.headers.push({ text: '', value: 'actions', sortable: false })
  },
  methods: {
    async fetchOrganizations () {
      this.loading = true
      try {
        this.organizations = await this.$axios.$get('api/organizations', {
          params: { q: this.q, allFields: true, page: this.pagination.page, size: this.pagination.itemsPerPage, sort: this.sort }
        })
        this.pagination.totalItems = this.organizations.count
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
      this.loading = false

      if (!this.$uiConfig.readonly) {
        for (const org of this.organizations.results) {
          const limits = await this.$axios.$get(`api/limits/organization/${org.id}`)
          this.$set(org, 'limits', limits)
        }
      }
    },
    async deleteOrganization (organization) {
      try {
        await this.$axios.$delete(`api/organizations/${organization.id}`)
        this.fetchOrganizations()
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async saveLimits (organization, limits) {
      if (!limits.store_nb_members.limit) limits.store_nb_members.limit = 0
      delete organization.limits
      await this.$axios.$post(`api/limits/organization/${organization.id}`, limits)
      this.$set(organization, 'limits', limits)
    }
  }
}
</script>

<style lang="css">
</style>
