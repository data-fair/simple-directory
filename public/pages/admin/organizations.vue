<template lang="html">
  <v-container fluid data-iframe-height>
    <v-layout row wrap class="mt-3">
      <h2 class="title mb-3">
        {{ $t('common.organizations') }} <span v-if="organizations">({{ $n(organizations.count) }})</span>
      </h2>
    </v-layout>

    <v-layout row wrap class="mb-3">
      <v-text-field
        :label="$t('common.search')"
        v-model="q"
        name="search"
        solo
        style="max-width:300px;"
        append-icon="mdi-magnify"
        @click:append="fetchOrganizations"
        @keyup.enter="fetchOrganizations"/>
    </v-layout>

    <v-data-table
      v-if="organizations"
      :headers="headers"
      :items="organizations.results"
      :pagination.sync="pagination"
      :total-items="pagination.totalItems"
      :loading="loading"
      :rows-per-page-items="[10, 25, 100]"
      class="elevation-1"
      item-key="id"
      rows-per-page-text=""
    >
      <template slot="items" slot-scope="props">
        <td>
          <v-avatar :size="40"><img :src="env.publicUrl + '/api/avatars/organization/' + props.item.id + '/avatar.png'"></v-avatar>
        </td>
        <td>{{ props.item.name }}</td>
        <td>{{ props.item.id }}</td>
        <td>{{ props.item.description }}</td>
        <template v-if="!env.readonly">
          <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
          <td>{{ props.item.updated && $d(new Date(props.item.updated.date)) }}</td>
          <td class="justify-center layout px-0">
            <v-btn
              :loading="!props.item.limits"
              :color="!props.item.limits ? 'default' : (props.item.limits.store_nb_members.consumption >= props.item.limits.store_nb_members.limit ? 'warning' : 'primary')"
              :dark="!!props.item.limits"
              small
              round
              class="mt-2 text-lowercase"
              @click="currentOrganization = props.item;currentLimits = JSON.parse(JSON.stringify(props.item.limits));limitOrganizationDialog = true"
            >
              <template v-if="props.item.limits">
                <template v-if="!props.item.limits.store_nb_members || !props.item.limits.store_nb_members.consumption">{{ $t('common.missingInfo') }}</template>
                <template v-else-if="props.item.limits.store_nb_members.limit === 0">{{ props.item.limits.store_nb_members.consumption.toLocaleString() }} {{ $t('pages.admin.organizations.members') }}</template>
                <template v-else>{{ props.item.limits.store_nb_members.consumption.toLocaleString() }} / {{ props.item.limits.store_nb_members.limit.toLocaleString() }} {{ $t('pages.admin.organizations.members') }}</template>
              </template>
            </v-btn>
            <v-btn :to="localePath({name: 'organization-id', params: {id: props.item.id}})" icon class="mx-0">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon class="mx-0" @click="currentOrganization = props.item;deleteOrganizationDialog = true">
              <v-icon color="warning">mdi-delete</v-icon>
            </v-btn>
          </td>
        </template>
      </template>
    </v-data-table>

    <v-dialog v-model="deleteOrganizationDialog" max-width="500px">
      <v-card v-if="currentOrganization">
        <v-card-title class="title">
          {{ $t('common.confirmDeleteTitle', {name: currentOrganization.name}) }}
        </v-card-title>
        <v-card-text>
          {{ $t('common.confirmDeleteMsg') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="deleteOrganizationDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="deleteOrganizationDialog = false;deleteOrganization(currentOrganization)">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="limitOrganizationDialog" max-width="500px">
      <v-card v-if="currentOrganization">
        <v-card-title class="title">
          {{ $t('pages.admin.organizations.limitOrganizationTitle', {name: currentOrganization.name}) }}
        </v-card-title>
        <v-card-text v-if="currentLimits">
          <v-text-field v-model.number="currentLimits.store_nb_members.limit" :label="$t('pages.admin.organizations.nbMembers')" type="number" />
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="limitOrganizationDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="limitOrganizationDialog = false;saveLimits(currentOrganization, currentLimits)">{{ $t('common.confirmOk') }}</v-btn>
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
    pagination: { page: 1, rowsPerPage: 10, totalItems: 0, descending: false, sortBy: 'name' },
    loading: false,
    headers: null
  }),
  computed: {
    sort() {
      if (!this.pagination.sortBy) return ''
      return (this.pagination.descending ? '-' : '') + this.pagination.sortBy
    },
    ...mapState(['env'])
  },
  watch: {
    'pagination.page'() { this.fetchOrganizations() },
    'pagination.rowsPerPage'() { this.fetchOrganizations() },
    'pagination.sortBy'() { this.fetchOrganizations() },
    'pagination.descending'() { this.fetchOrganizations() }
  },
  async mounted() {
    this.fetchOrganizations()
    this.headers = [
      { text: this.$t('common.avatar'), sortable: false },
      { text: this.$t('common.name'), value: 'name' },
      { text: this.$t('common.id'), value: 'id', sortable: false },
      { text: this.$t('common.description'), value: 'description', sortable: false }
    ]
    if (!this.env.readonly) {
      this.headers = this.headers.concat([
        { text: this.$t('common.createdAt'), value: 'created.date' },
        { text: this.$t('common.updatedAt'), value: 'updated.date' },
        { text: '', value: 'actions', sortable: false }
      ])
    }
  },
  methods: {
    async fetchOrganizations() {
      this.loading = true
      try {
        this.organizations = await this.$axios.$get(`api/organizations`,
          { params: { q: this.q, allFields: true, page: this.pagination.page, size: this.pagination.rowsPerPage, sort: this.sort } })
        this.pagination.totalItems = this.organizations.count
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
      this.loading = false

      for (const org of this.organizations.results) {
        const limits = await this.$axios.$get(`api/limits/organization/${org.id}`)
        this.$set(org, 'limits', limits)
      }
    },
    async deleteOrganization(organization) {
      try {
        await this.$axios.$delete(`api/organizations/${organization.id}`)
        this.fetchOrganizations()
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async saveLimits(organization, limits) {
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
