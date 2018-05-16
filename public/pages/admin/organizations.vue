<template lang="html">
  <v-container>
    <v-layout row wrap class="mt-3">
      <h2 class="title mb-3">
        {{ $t('common.organizations') }} <span v-if="organizations">({{ $n(organizations.count) }})</span>
      </h2>
    </v-layout>

    <v-layout row wrap class="mb-3">
      <v-text-field
        :label="$t('common.search')"
        v-model="q"
        :append-icon-cb="fetchOrganizations"
        name="search"
        solo
        style="max-width:300px;"
        append-icon="search"
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
        <td>{{ props.item.name }}</td>
        <td>{{ props.item.description }}</td>
        <template v-if="!env.readonly">
          <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
          <td>{{ props.item.updated && $d(new Date(props.item.updated.date)) }}</td>
          <td class="justify-center layout px-0">
            <v-btn icon class="mx-0" @click="currentOrganization = props.item;deleteOrganizationDialog = true">
              <v-icon color="warning">delete</v-icon>
            </v-btn>
          </td>
        </template>
      </template>
    </v-data-table>

    <v-dialog v-model="deleteOrganizationDialog" max-width="500px">
      <v-card v-if="currentOrganization">
        <v-card-title primary-title>
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
  </v-container>
</template>

<script>
import {mapState} from 'vuex'
import eventBus from '../../event-bus'
export default {
  data: () => ({
    organizations: null,
    currentOrganization: null,
    deleteOrganizationDialog: false,
    q: '',
    pagination: {page: 1, rowsPerPage: 25, totalItems: 0, descending: false, sortBy: 'name'},
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
      {text: this.$t('common.name'), value: 'name'},
      {text: this.$t('common.description'), value: 'description'}
    ]
    if (!this.env.readonly) {
      this.headers = this.headers.concat([
        {text: this.$t('common.createdAt'), value: 'created.date'},
        {text: this.$t('common.updatedAt'), value: 'updated.date'},
        {text: ''}
      ])
    }
  },
  methods: {
    async fetchOrganizations() {
      this.loading = true
      try {
        this.organizations = await this.$axios.$get(`api/organizations`,
          {params: {q: this.q, allFields: true, page: this.pagination.page, size: this.pagination.rowsPerPage, sort: this.sort}})
        this.pagination.totalItems = this.organizations.count
      } catch (error) {
        eventBus.$emit('notification', {error})
      }
      this.loading = false
    },
    async deleteOrganization(organization) {
      try {
        await this.$axios.$delete(`api/organizations/${organization.id}`)
        this.fetchOrganizations()
      } catch (error) {
        eventBus.$emit('notification', {error})
      }
    }
  }
}
</script>

<style lang="css">
</style>
