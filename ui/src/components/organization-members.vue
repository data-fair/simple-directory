<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          size="large"
          color="primary"
          style="top:-2px"
        >
          mdi-account
        </v-icon>
        {{ orgStorage === 'true' ? $t('common.orgStorageMembers') : $t('common.members') }} <span v-if="members">({{ $n(members.count) }})</span>
        <add-member-menu
          v-if="!$uiConfig.readonly"
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
        <v-btn
          icon
          color="primary"
          class="mx-1"
          :href="csvUrl"
          :title="$t('common.downloadCsv')"
        >
          <v-icon>mdi-file-table</v-icon>
        </v-btn>
      </h2>
    </v-row>

    <v-row dense>
      <v-col :cols="filterMemberCols">
        <v-text-field
          v-model="q"
          :label="$t('common.search')"
          name="search"
          variant="solo"
          append-icon="mdi-magnify"
          clearable
          hide-details="auto"
          @click:clear="$nextTick(() => $nextTick(() => fetchMembers(1)))"
          @click:append="fetchMembers(1)"
          @keyup.enter="fetchMembers(1)"
        />
      </v-col>
      <v-col :cols="filterMemberCols">
        <v-select
          v-model="role"
          :items="orga.roles"
          :label="$t('common.role')"
          name="role"
          variant="solo"
          clearable
          hide-details="auto"
          @update:model-value="fetchMembers(1)"
        />
      </v-col>
      <v-col :cols="filterMemberCols">
        <v-autocomplete
          v-if="$uiConfig.manageDepartments && orga.departments && orga.departments.length && !adminDepartment"
          v-model="department"
          :items="[{id: '-', name: 'aucun'}].concat(orga.departments)"
          :label="orga.departmentLabel || $t('common.department')"
          item-value="id"
          item-title="name"
          clearable
          name="department"
          variant="solo"
          hide-details="auto"
          @update:model-value="fetchMembers(1)"
        />
      </v-col>
      <v-col
        v-if="$uiConfig.alwaysAcceptInvitation"
        :cols="filterMemberCols"
      >
        <v-select
          v-model="emailConfirmedFilter"
          :items="[{id: 'true', name: $t('common.emailConfirmed')}, {id: 'false', name: $t('common.emailNotConfirmed')}]"
          :label="$t('common.creationStep')"
          item-value="id"
          item-title="name"
          clearable
          name="storage"
          variant="solo"
          @update:model-value="fetchMembers(1)"
        />
      </v-col>
    </v-row>

    <v-list
      v-if="members && members.count"
      class="elevation-1 mt-1"
    >
      <template v-for="(member, i) in members.results">
        <v-list-item
          :key="`${member.id}-${member.department}`"
          :class="{'secondary-member': members.results[i-1] && members.results[i-1].id === member.id}"
        >
          <v-list-item-avatar>
            <v-img
              v-if="!members.results[i-1] || members.results[i-1].id !== member.id"
              :src="`${$uiConfig.publicUrl}/api/avatars/user/${member.id}/avatar.png`"
            />
          </v-list-item-avatar>

          <template v-if="!members.results[i-1] || members.results[i-1].id !== member.id">
            <v-list-item-title style="white-space:normal;">
              {{ member.name }} ({{ member.email }})
              <template v-if="member.emailConfirmed === false">
                <span class="text-warning">{{ $t('common.emailNotConfirmed') }}
                  <resend-invitation
                    :member="member"
                    :orga="orga"
                    :department="adminDepartment"
                  />
                </span>
              </template>
            </v-list-item-title>
            <v-list-item-subtitle
              v-if="member.host"
              style="white-space:normal;"
            >
              {{ $t('common.host') }} = {{ member.host }}
            </v-list-item-subtitle>
            <v-list-item-subtitle
              v-if="member.plannedDeletion"
              style="white-space:normal;"
            >
              {{ $t('common.plannedDeletion') }} = {{ $d(new Date(member.plannedDeletion)) }}
            </v-list-item-subtitle>
          </template>
          <v-list-item-subtitle style="white-space:normal;">
            <span v-if="member.department">{{ orga.departmentLabel || $t('common.department') }} = {{ member.departmentName || member.department }}, </span>
            <span>{{ $t('common.role') }} = {{ member.role }}</span>
          </v-list-item-subtitle>

          <v-list-item-action v-if="isAdminOrga && (!readonly || $uiConfig.overwrite.includes('members'))">
            <edit-member-menu
              :orga="orga"
              :member="member"
              :department="adminDepartment"
              @save="newMember => saveMember(newMember, member)"
            />
          </v-list-item-action>
          <v-list-item-action v-if="user.adminMode && !member.orgStorage">
            <v-btn
              :title="$t('common.asAdmin')"
              icon
              :disabled="!member.emailConfirmed"
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
              :orga="orga"
              @delete="deleteMember"
            />
          </v-list-item-action>
        </v-list-item>
        <v-divider
          v-if="members.results[i+1] && members.results[i+1].id !== member.id"
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
        :model-value="membersPage"
        :length="Math.ceil(members.count / membersPageSize)"
        @update:model-value="fetchMembers"
      />
    </v-row>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import eventBus from '../event-bus'

export default {
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
    membersPageSize: 10,
    emailConfirmedFilter: null
  }),
  computed: {
    ...mapState(['userDetails', 'env']),
    ...mapState('session', ['user']),
    disableInvite () {
      return !this.nbMembersLimits || (this.nbMembersLimits.limit > 0 && this.nbMembersLimits.consumption >= this.nbMembersLimits.limit)
    },
    notifyTopics () {
      if (this.$uiConfig.alwaysAcceptInvitation) {
        return [{ key: 'simple-directory:add-member', title: this.$t('notifications.addMemberTopic') }]
      } else {
        return [
          { key: 'simple-directory:invitation-sent', title: this.$t('notifications.sentInvitationTopic') },
          { key: 'simple-directory:invitation-accepted', title: this.$t('notifications.acceptedInvitationTopic') }
        ]
      }
    },
    csvUrl () {
      return this.$uiConfig.publicUrl + `/api/organizations/${this.orga.id}/members?size=10000&format=csv`
    },
    filterMemberCols () {
      return this.$uiConfig.alwaysAcceptInvitation ? 6 : 4
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
        const params = {
          q: this.q,
          page: this.membersPage,
          size: this.membersPageSize,
          department: this.department,
          role: this.role,
          org_storage: this.orgStorage,
          sort: 'name'
        }
        if (this.emailConfirmedFilter !== null) {
          params.email_confirmed = this.emailConfirmedFilter
        }
        this.members = await this.$axios.$get(`api/organizations/${this.orga.id}/members`, { params })
        if (this.members.count && !this.members.results.length) {
          this.fetchMembers(page - 1)
        }
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async deleteMember (member) {
      try {
        await this.$axios.$delete(`api/organizations/${this.orga.id}/members/${member.id}`, { params: { department: member.department } })
        eventBus.$emit('notification', this.$t('pages.organization.deleteMemberSuccess', { name: member.name }))
        this.fetchMembers(this.membersPage)
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async saveMember (member, oldMember) {
      try {
        const patch = { role: member.role }
        if (member.department) {
          const dep = this.orga.departments.find(d => d.id === member.department)
          patch.department = dep.id
          patch.departmentName = dep.name
        }
        await this.$axios.patch(`api/organizations/${this.orga.id}/members/${member.id}`,
          patch,
          { params: { department: oldMember.department } }
        )
        this.fetchMembers(this.membersPage)
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style lang="css" scoped>
.v-list .v-list-item.secondary-member {
  min-height: 36px;
  height: 36px;
}
.v-list .v-list-item.secondary-member .v-list-item__action {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
