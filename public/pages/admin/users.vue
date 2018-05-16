<template lang="html">
  <v-container>
    <v-layout row wrap class="mt-3">
      <h2 class="title mb-3">
        {{ $t('common.users') }} <span v-if="users">({{ $n(users.count) }})</span>
      </h2>
    </v-layout>

    <v-layout row wrap class="mb-3">
      <v-text-field
        :label="$t('common.search')"
        v-model="q"
        :append-icon-cb="fetchUsers"
        name="search"
        solo
        style="max-width:300px;"
        append-icon="search"
        @keyup.enter="fetchUsers"/>
    </v-layout>

    <v-data-table
      v-if="users"
      :headers="headers"
      :items="users.results"
      :pagination.sync="pagination"
      :total-items="pagination.totalItems"
      :loading="loading"
      :rows-per-page-items="[10, 25, 100]"
      class="elevation-1"
      item-key="id"
      rows-per-page-text=""
    >
      <template slot="items" slot-scope="props">
        <td>{{ props.item.email }}</td>
        <td>{{ props.item.firstName }}</td>
        <td>{{ props.item.lastName }}</td>
        <td><span v-for="orga in props.item.organizations" :key="orga.id">
          <nuxt-link :to="localePath({name: 'organization-id', params: {id: orga.id}})">{{ orga.name }} ({{ orga.role }})</nuxt-link>
          &nbsp;
        </span></td>
        <template v-if="!env.readonly">
          <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
          <td>{{ props.item.updated && $d(new Date(props.item.updated.date)) }}</td>
          <td>{{ props.item.logged && $d(new Date(props.item.logged)) }}</td>
          <td class="justify-center layout px-0">
            <v-btn icon class="mx-0" @click="currentUser = props.item;deleteUserDialog = true">
              <v-icon color="warning">delete</v-icon>
            </v-btn>
          </td>
        </template>
      </template>
    </v-data-table>

    <v-dialog v-model="deleteUserDialog" max-width="500px">
      <v-card v-if="currentUser">
        <v-card-title primary-title>
          {{ $t('common.confirmDeleteTitle', {name: currentUser.name}) }}
        </v-card-title>
        <v-card-text>
          {{ $t('common.confirmDeleteMsg') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="deleteUserDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="deleteUserDialog = false;deleteUser(currentUser)">{{ $t('common.confirmOk') }}</v-btn>
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
    users: null,
    currentUser: null,
    deleteUserDialog: false,
    q: '',
    pagination: {page: 1, rowsPerPage: 25, totalItems: 0, descending: false, sortBy: 'email'},
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
    'pagination.page'() { this.fetchUsers() },
    'pagination.rowsPerPage'() { this.fetchUsers() },
    'pagination.sortBy'() { this.fetchUsers() },
    'pagination.descending'() { this.fetchUsers() }
  },
  async mounted() {
    this.fetchUsers()
    this.headers = [
      {text: this.$t('common.email'), value: 'email'},
      {text: this.$t('common.firstName'), value: 'firstName'},
      {text: this.$t('common.lastName'), value: 'lastName'},
      {text: this.$t('common.organizations'), value: 'organizations', sortable: false}
    ]
    if (!this.env.readonly) {
      this.headers = this.headers.concat([
        {text: this.$t('common.createdAt'), value: 'created.date'},
        {text: this.$t('common.updatedAt'), value: 'updated.date'},
        {text: this.$t('common.loggedAt'), value: 'logged'},
        {text: ''}
      ])
    }
  },
  methods: {
    async fetchUsers() {
      this.loading = true
      try {
        this.users = await this.$axios.$get(`api/users`,
          {params: {q: this.q, allFields: true, page: this.pagination.page, size: this.pagination.rowsPerPage, sort: this.sort}})
        this.pagination.totalItems = this.users.count
      } catch (error) {
        eventBus.$emit('notification', {error})
      }
      this.loading = false
    },
    async deleteUser(user) {
      try {
        await this.$axios.$delete(`api/users/${user.id}`)
        this.fetchUsers()
      } catch (error) {
        eventBus.$emit('notification', {error})
      }
    }
  }
}
</script>

<style lang="css">
</style>
