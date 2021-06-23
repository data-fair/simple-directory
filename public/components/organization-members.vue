<template>
  <v-container fluid class="pa-0">
    <v-row class="mt-3 mx-0">
      <h3 class="text-h6 my-3">
        {{ $t('common.members') }} <span v-if="members">({{ $n(members.count) }})</span>
      </h3>
      <add-member-menu
        v-if="!env.readonly"
        :orga="orga"
        :is-admin-orga="isAdminOrga"
        :members="members"
        :disable-invite="disableInvite"
      />
    </v-row>

    <v-row class="mx-0">
      <v-text-field
        v-model="q"
        :label="$t('common.search')"
        name="search"
        solo
        style="max-width:300px;"
        append-icon="mdi-magnify"
        @click:append="fetchMembers"
        @keyup.enter="fetchMembers"
      />
      <v-select
        v-model="role"
        :items="orga.roles"
        :label="$t('common.role')"
        style="max-width:300px;"
        class="ml-2"
        name="role"
        solo
        clearable
        @change="fetchMembers"
      />
      <v-select
        v-if="env.manageDepartments && orga.departments && orga.departments.length"
        v-model="department"
        :items="orga.departments"
        :label="orga.departmentLabel || $t('common.department')"
        style="max-width:300px;"
        item-value="id"
        item-text="name"
        clearable
        class="ml-2"
        name="department"
        solo
        @change="fetchMembers"
      />
      <v-spacer />
    </v-row>

    <v-list
      v-if="members && members.count"
      two-line
      class="elevation-1 mt-1"
    >
      <template v-for="(member, i) in members.results">
        <v-list-item :key="member.id">
          <v-list-item-content>
            <v-list-item-title>{{ member.name }} ({{ member.email }})</v-list-item-title>
            <v-list-item-subtitle>
              <span>{{ $t('common.role') }} = {{ member.role }}</span>
              <span v-if="member.department">, {{ orga.departmentLabel || $t('common.department') }} = {{ orga.departments.find(d => d.id === member.department) && orga.departments.find(d => d.id === member.department).name }}</span>
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action v-if="isAdminOrga && !env.readonly">
            <edit-member-menu
              :orga="orga"
              :member="member"
              @save="saveMember"
            />
          </v-list-item-action>
          <v-list-item-action v-if="user.adminMode">
            <v-btn
              :title="$t('common.asAdmin')"
              icon
              @click="asAdmin(member)"
            >
              <v-icon color="warning">
                mdi-account-switch
              </v-icon>
            </v-btn>
          </v-list-item-action>
          <v-list-item-action v-if="isAdminOrga && !env.readonly" class="ml-0">
            <delete-member-menu
              :member="member"
              @delete="deleteMember"
            />
          </v-list-item-action>
        </v-list-item>
        <v-divider v-if="i + 1 < members.results.length" :key="i" />
      </template>
    </v-list>

    <v-row v-if="members && members.count > membersPageSize" class="mt-2">
      <v-spacer />
      <v-pagination
        v-model="membersPage"
        :length="Math.ceil(members.count / membersPageSize)"
        @input="fetchMembers"
      />
    </v-row>
  </v-container>
</template>

<script>
  import { mapState, mapActions } from 'vuex'
  import eventBus from '../event-bus'
  import AddMemberMenu from '~/components/add-member-menu'
  import DeleteMemberMenu from '~/components/delete-member-menu'
  import EditMemberMenu from '~/components/edit-member-menu'

  export default {
    components: { AddMemberMenu, DeleteMemberMenu, EditMemberMenu },
    props: {
      isAdminOrga: {
        type: Boolean,
        default: null,
      },
      orga: {
        type: Object,
        default: null,
      },
      nbMembersLimits: {
        type: Object,
        default: null,
      },
    },
    data: () => ({
      members: null,
      roles: null,
      q: '',
      role: null,
      department: null,
      membersPage: 1,
      membersPageSize: 10,
    }),
    computed: {
      ...mapState(['userDetails', 'env']),
      ...mapState('session', ['user']),
      disableInvite() {
        return !this.nbMembersLimits || (this.nbMembersLimits.limit > 0 && this.nbMembersLimits.consumption >= this.nbMembersLimits.limit)
      },
    },
    async mounted() {
      this.fetchMembers()
    },
    methods: {
      ...mapActions('session', ['asAdmin']),
      async fetchMembers() {
        try {
          this.members = await this.$axios.$get(`api/organizations/${this.orga.id}/members`,
                                                { params: { q: this.q, page: this.membersPage, size: this.membersPageSize, department: this.department, role: this.role } })
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      async deleteMember(member) {
        try {
          await this.$axios.$delete(`api/organizations/${this.orga.id}/members/${member.id}`)
          eventBus.$emit('notification', this.$t('pages.organization.deleteMemberSuccess', { name: member.name }))
          this.fetchMembers()
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      async saveMember(member) {
        try {
          await this.$axios.patch(`api/organizations/${this.orga.id}/members/${member.id}`, { role: member.role, department: member.department })
          this.fetchMembers()
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
    },
  }
</script>

<style lang="css" scoped>
</style>
