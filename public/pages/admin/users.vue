<template lang="html">
  <v-container fluid data-iframe-height>
    <v-layout row wrap class="mt-3">
      <h2 class="title mb-3">
        {{ $t('common.users') }} <span v-if="users">({{ $n(users.count) }})</span>
      </h2>
    </v-layout>

    <v-layout row wrap class="mb-3">
      <p v-if="env.defaultMaxCreatedOrgs === -1">{{ $t('pages.admin.users.noCreatedOrgsLimit') }}</p>
      <p v-else>{{ $t('pages.admin.users.createdOrgsLimit', {defaultMaxCreatedOrgs: env.defaultMaxCreatedOrgs}) }}</p>
    </v-layout>

    <v-layout row wrap class="mb-3">
      <v-text-field
        :label="$t('common.search')"
        v-model="q"
        name="search"
        solo
        style="max-width:300px;"
        append-icon="mdi-magnify"
        @click:append="fetchUsers"
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
        <td>
          <v-avatar :size="40"><img :src="env.publicUrl + '/api/avatars/user/' + props.item.id + '/avatar.png'"></v-avatar>
        </td>
        <td>
          <span style="white-space: nowrap;">
            {{ props.item.email }}
            <v-btn icon class="mx-0" @click="showEditUserEmailDialog(props.item)">
              <v-icon small>mdi-pencil</v-icon>
            </v-btn>
          </span>

        </td>
        <td>{{ props.item.id }}</td>
        <td>{{ props.item.firstName }}</td>
        <td>{{ props.item.lastName }}</td>
        <td>
          <template v-if="props.item['2FA'] && props.item['2FA'].active">
            oui
            <v-btn icon class="mx-0" @click="showDrop2FADialog(props.item)">
              <v-icon small>mdi-delete</v-icon>
            </v-btn>
          </template>
          <span v-else>non</span>
        </td>
        <td><span v-for="orga in props.item.organizations" :key="orga.id">
          <nuxt-link :to="localePath({name: 'organization-id', params: {id: orga.id}})">{{ orga.name }} ({{ orga.role }})</nuxt-link>
          &nbsp;
        </span></td>
        <td v-if="env.defaultMaxCreatedOrgs !== -1 && !env.readonly">
          <span>{{ props.item.maxCreatedOrgs }}</span>
          <v-btn v-if="env.defaultMaxCreatedOrgs !== -1" icon class="mx-0" @click="showEditMaxCreatedOrgsDialog(props.item)">
            <v-icon small>mdi-pencil</v-icon>
          </v-btn>
        </td>
        <template v-if="!env.readonly">
          <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
          <td>{{ props.item.updated && $d(new Date(props.item.updated.date)) }}</td>
          <td>{{ props.item.logged && $d(new Date(props.item.logged)) }}</td>
          <td class="justify-center layout px-0">
            <v-btn :title="$t('common.asAdmin')" icon class="mx-0" @click="asAdmin(props.item)">
              <v-icon color="warning">mdi-account-switch</v-icon>
            </v-btn>
            <v-btn :title="$t('common.delete')" icon class="mx-0" @click="currentUser = props.item;deleteUserDialog = true">
              <v-icon color="warning">mdi-delete</v-icon>
            </v-btn>
          </td>
        </template>
        <template v-else>
          <v-btn :title="$t('common.asAdmin')" icon class="mx-0" @click="asAdmin(props.item)">
            <v-icon color="warning">mdi-account-switch</v-icon>
          </v-btn>
        </template>
      </template>
    </v-data-table>

    <v-dialog v-model="deleteUserDialog" max-width="500px">
      <v-card v-if="currentUser">
        <v-card-title class="title">
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

    <v-dialog v-model="editUserEmailDialog" max-width="500px">
      <v-card v-if="currentUser">
        <v-card-title class="title">
          {{ $t('pages.admin.users.editUserEmailTitle', {name: currentUser.name}) }}
        </v-card-title>
        <v-card-text>
          <v-alert :value="true" type="error">
            {{ $t('pages.admin.users.editUserEmailText') }}
          </v-alert>
          <v-text-field v-model="email" />
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="editUserEmailDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="editUserEmailDialog = false;saveUserEmail(currentUser, email)">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editMaxCreatedOrgsDialog" max-width="500px">
      <v-card v-if="currentUser">
        <v-card-title class="title">
          {{ $t('common.editTitle', {name: currentUser.name}) }}
        </v-card-title>
        <v-card-text>
          <p>{{ $t('pages.admin.users.explainLimit', {defaultMaxCreatedOrgs: env.defaultMaxCreatedOrgs}) }}</p>
          <p v-if="nbCreatedOrgs !== null">{{ $t('common.nbCreatedOrgs') + ' ' + nbCreatedOrgs }} </p>
          <v-text-field id="maxCreatedOrgs" v-model="newMaxCreatedOrgs" :label="$t('common.maxCreatedOrgs')" name="maxCreatedOrgs" type="number"/>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="editMaxCreatedOrgsDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="editMaxCreatedOrgsDialog = false;saveMaxCreatedOrgs(currentUser, newMaxCreatedOrgs)">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="drop2FADialog" max-width="500px">
      <v-card v-if="currentUser">
        <v-card-title class="title">
          {{ $t('pages.admin.users.drop2FATitle', {name: currentUser.name}) }}
        </v-card-title>
        <v-card-text>
          <v-alert :value="true" type="error">
            {{ $t('pages.admin.users.drop2FAExplain') }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="drop2FADialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="drop2FADialog = false;drop2FA(currentUser)">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import eventBus from '../../event-bus'
export default {
  data: () => ({
    users: null,
    currentUser: null,
    email: null,
    deleteUserDialog: false,
    editMaxCreatedOrgsDialog: false,
    editUserEmailDialog: false,
    drop2FADialog: false,
    q: '',
    pagination: { page: 1, rowsPerPage: 10, totalItems: 0, descending: false, sortBy: 'email' },
    loading: false,
    headers: null,
    newMaxCreatedOrgs: null,
    nbCreatedOrgs: null
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
      { text: this.$t('common.avatar'), sortable: false },
      { text: this.$t('common.email'), value: 'email' },
      { text: this.$t('common.id'), value: 'id', sortable: false },
      { text: this.$t('common.firstName'), value: 'firstName' },
      { text: this.$t('common.lastName'), value: 'lastName' },
      { text: this.$t('common.2FA'), value: '2FA', sortable: false },
      { text: this.$t('common.organizations'), value: 'organizations', sortable: false }
    ]
    if (this.env.defaultMaxCreatedOrgs !== -1 && !this.env.readonly) {
      this.headers.push({ text: this.$t('common.maxCreatedOrgs'), value: 'maxCreatedOrgs', sortable: false })
    }
    if (!this.env.readonly) {
      this.headers = this.headers.concat([
        { text: this.$t('common.createdAt'), value: 'created.date' },
        { text: this.$t('common.updatedAt'), value: 'updated.date' },
        { text: this.$t('common.loggedAt'), value: 'logged' }
      ])
    }
    this.headers.push({ text: '', value: 'actions', sortable: false })
  },
  methods: {
    ...mapActions('session', ['asAdmin']),
    async fetchUsers() {
      this.loading = true
      try {
        this.users = await this.$axios.$get(`api/users`,
          { params: { q: this.q, allFields: true, page: this.pagination.page, size: this.pagination.rowsPerPage, sort: this.sort } })
        this.pagination.totalItems = this.users.count
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
      this.loading = false
    },
    async deleteUser(user) {
      try {
        await this.$axios.$delete(`api/users/${user.id}`)
        this.fetchUsers()
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async showEditUserEmailDialog(user) {
      this.currentUser = user
      this.email = user.email
      this.editUserEmailDialog = true
    },
    async saveUserEmail(user, email) {
      try {
        await this.$axios.$patch(`api/users/${user.id}`, { email })
        this.$set(user, 'email', email)
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async showEditMaxCreatedOrgsDialog(user) {
      this.currentUser = user
      this.newMaxCreatedOrgs = user.maxCreatedOrgs
      this.nbCreatedOrgs = null
      this.editMaxCreatedOrgsDialog = true
      this.nbCreatedOrgs = (await this.$axios.$get(`api/organizations`, { params: { creator: user.id, size: 0 } })).count
    },
    showDrop2FADialog(user) {
      this.currentUser = user
      this.drop2FADialog = true
    },
    async saveMaxCreatedOrgs(user, newMaxCreatedOrgs) {
      if (newMaxCreatedOrgs === '' || newMaxCreatedOrgs === undefined) newMaxCreatedOrgs = null
      if (newMaxCreatedOrgs !== null) newMaxCreatedOrgs = Number(newMaxCreatedOrgs)
      try {
        await this.$axios.$patch(`api/users/${user.id}`, { maxCreatedOrgs: newMaxCreatedOrgs })
        this.$set(user, 'maxCreatedOrgs', newMaxCreatedOrgs)
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async drop2FA(user) {
      try {
        await this.$axios.$patch(`api/users/${user.id}`, { '2FA': { active: false } })
        this.$set(user, '2FA', { active: false })
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style lang="css">
</style>
