<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          large
          color="primary"
          style="top:-2px"
        >
          mdi-account
        </v-icon>
        {{ orgStorage === 'true' ? $t('common.orgStorageMembers') : $t('common.members') }} <span v-if="members">({{ $n(members.count) }})</span>
        <add-member-menu
          v-if="!env.readonly"
          :orga="orga"
          :is-admin-orga="isAdminOrga"
          :members="members"
          :disable-invite="disableInvite"
          :department="adminDepartment"
          @sent="fetchMembers(membersPage)"
        />
        <notify-menu
          v-if="isAdminOrga"
          :sender="`organization:${orga.id}:${department || ''}:admin`"
          :topics="notifyTopics"
        />
      </h2>
    </v-row>

    <v-row dense>
      <v-col cols="4">
        <v-text-field
          v-model="q"
          :label="$t('common.search')"
          name="search"
          solo
          append-icon="mdi-magnify"
          clearable
          @click:clear="$nextTick(() => $nextTick(() => fetchMembers(1)))"
          @click:append="fetchMembers(1)"
          @keyup.enter="fetchMembers(1)"
        />
      </v-col>
      <v-col cols="4">
        <v-select
          v-model="role"
          :items="orga.roles"
          :label="$t('common.role')"
          name="role"
          solo
          clearable
          @change="fetchMembers(1)"
        />
      </v-col>
      <v-col cols="4">
        <v-autocomplete
          v-if="env.manageDepartments && orga.departments && orga.departments.length && !adminDepartment"
          v-model="department"
          :items="orga.departments"
          :label="orga.departmentLabel || $t('common.department')"
          item-value="id"
          item-text="name"
          clearable
          name="department"
          solo
          @change="fetchMembers(1)"
        />
      </v-col>
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
            <v-list-item-subtitle style="white-space:normal;">
              <span>{{ $t('common.role') }} = {{ member.role }}</span>
              <span v-if="member.department">, {{ orga.departmentLabel || $t('common.department') }} = {{ orga.departments.find(d => d.id === member.department) && orga.departments.find(d => d.id === member.department).name }}</span>
              <template v-if="member.emailConfirmed === false">
                - <span class="warning--text">{{ $t('common.emailNotConfirmed') }}
                  <resend-invitation
                    :member="member"
                    :orga="orga"
                    :department="adminDepartment"
                  />
                </span>
              </template>
            </v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action v-if="isAdminOrga && !readonly">
            <edit-member-menu
              :orga="orga"
              :member="member"
              :department="adminDepartment"
              @save="saveMember"
            />
          </v-list-item-action>
          <v-list-item-action v-if="user.adminMode && !member.orgStorage">
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
          <v-list-item-action
            v-if="isAdminOrga && !readonly"
            class="ml-0"
          >
            <delete-member-menu
              :member="member"
              @delete="deleteMember"
            />
          </v-list-item-action>
        </v-list-item>
        <v-divider
          v-if="i + 1 < members.results.length"
          :key="i"
        />
      </template>
    </v-list>

    <v-row
      v-if="members && members.count > membersPageSize"
      class="mt-2"
    >
      <v-spacer />
      <v-pagination
        :value="membersPage"
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
      default: null
    },
    orga: {
      type: Object,
      default: null
    },
    nbMembersLimits: {
      type: Object,
      default: null
    },
    orgStorage: {
      type: String,
      default: 'both'
    },
    readonly: {
      type: Boolean,
      default: false
    },
    adminDepartment: {
      type: String,
      required: false,
      default: null
    }
  },
  data: () => ({
    members: null,
    roles: null,
    q: '',
    role: null,
    department: null,
    membersPage: 1,
    membersPageSize: 10
  }),
  computed: {
    ...mapState(['userDetails', 'env']),
    ...mapState('session', ['user']),
    disableInvite () {
      return !this.nbMembersLimits || (this.nbMembersLimits.limit > 0 && this.nbMembersLimits.consumption >= this.nbMembersLimits.limit)
    },
    notifyTopics () {
      if (this.env.alwaysAcceptInvitation) {
        return [{ key: 'simple-directory:add-member', title: this.$t('notifications.addMemberTopic') }]
      } else {
        return [
          { key: 'simple-directory:invitation-sent', title: this.$t('notifications.sentInvitationTopic') },
          { key: 'simple-directory:invitation-accepted', title: this.$t('notifications.acceptedInvitationTopic') }
        ]
      }
    }
  },
  async mounted () {
    this.department = this.adminDepartment
    this.fetchMembers(1)
  },
  methods: {
    ...mapActions('session', ['asAdmin']),
    async fetchMembers (page) {
      this.membersPage = page
      try {
        this.members = await this.$axios.$get(`api/organizations/${this.orga.id}/members`, {
          params: {
            q: this.q,
            page: this.membersPage,
            size: this.membersPageSize,
            department: this.department,
            role: this.role,
            org_storage: this.orgStorage
          }
        })
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async deleteMember (member) {
      try {
        await this.$axios.$delete(`api/organizations/${this.orga.id}/members/${member.id}`)
        eventBus.$emit('notification', this.$t('pages.organization.deleteMemberSuccess', { name: member.name }))
        this.fetchMembers(1)
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async saveMember (member) {
      try {
        await this.$axios.patch(`api/organizations/${this.orga.id}/members/${member.id}`, { role: member.role, department: member.department })
        this.fetchMembers(1)
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style lang="css" scoped>
</style>
