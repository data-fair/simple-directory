<template lang="html">
  <v-container>
    <h2 class="headline mb-3">{{ $t('common.organization') + ' ' + (orga && orga.name) }}</h2>
    <v-subheader v-if="orga">{{ $t('common.createdPhrase', {name: orga.created.name, date: $d(new Date(orga.created.date))}) }}</v-subheader>
    <v-form v-if="orga" ref="form" v-model="valid" lazy-validation @submit="save">
      <v-text-field
        :label="$t('common.name')"
        v-model="orga.name"
        :rules="[v => !!v || '']"
        :disabled="!isAdminOrga"
        name="name"
        required
      />
      <v-textarea
        :label="$t('common.description')"
        v-model="orga.description"
        :disabled="!isAdminOrga"
        name="description"
        outline
      />
      <v-layout row wrap>
        <v-spacer/>
        <v-btn v-if="isAdminOrga" color="primary" type="submit">{{ $t('common.save') }}</v-btn>
      </v-layout>
    </v-form>
    <v-layout row wrap class="mt-3">
      <h3 class="title my-3">
        {{ $t('common.members') }} <span v-if="members">({{ $n(members.count) }})</span>
      </h3>
      <v-btn v-if="isAdminOrga" :title="$t('pages.organization.addMember')" icon color="primary" @click="newInvitation(); inviteMemberDialog = true"><v-icon>add</v-icon></v-btn>
    </v-layout>

    <v-layout row wrap>
      <v-text-field
        :label="$t('common.search')"
        v-model="q"
        name="search"
        solo
        style="max-width:300px;"
        append-icon="search"
        @click:append="fetchMembers"
        @keyup.enter="fetchMembers"/>
      <v-spacer/>
      <v-pagination v-if="members && members.count > membersPageSize" :length="Math.ceil(members.count / membersPageSize)" v-model="membersPage" @input="fetchMembers"/>
    </v-layout>

    <v-list v-if="members" two-line class="elevation-1 mt-3">
      <v-list-tile v-for="member in members.results" :key="member.id">
        <v-list-tile-content>
          <v-list-tile-title>{{ member.name }}</v-list-tile-title>
          <v-list-tile-sub-title>{{ member.email }}</v-list-tile-sub-title>
          <v-list-tile-sub-title>{{ member.role }}</v-list-tile-sub-title>
        </v-list-tile-content>
        <v-list-tile-action v-if="isAdminOrga && member.id !== userDetails.id">
          <v-btn :title="$t('pages.organization.editMember')" flat icon @click="currentMember = member; newRole = member.role; editMemberDialog = true">
            <v-icon>edit</v-icon>
          </v-btn>
          <v-btn :title="$t('pages.organization.deleteMember')" flat icon color="warning" @click="currentMember = member;deleteMemberDialog = true">
            <v-icon>delete</v-icon>
          </v-btn>
        </v-list-tile-action>
      </v-list-tile>
    </v-list>

    <v-dialog v-model="inviteMemberDialog" max-width="500px">
      <v-card v-if="orga">
        <v-card-title primary-title>
          {{ $t('pages.organization.addMember') }}
        </v-card-title>
        <v-card-text>
          <v-form ref="inviteForm" v-model="validInvitation">
            <v-text-field
              id="id"
              v-model="invitation.email"
              :label="$t('pages.organization.inviteEmail')"
              :rules="[v => !!v || '']"
              name="email"
              required
            />
            <v-select
              :items="orga.roles"
              v-model="invitation.role"
              :label="$t('common.role')"
              :rules="[v => !!v || '']"
              name="role"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="inviteMemberDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="confirmInvitation()">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteMemberDialog" max-width="500px">
      <v-card v-if="currentMember">
        <v-card-title primary-title>
          {{ $t('pages.organization.confirmDeleteMemberTitle', {name: currentMember.name}) }}
        </v-card-title>
        <v-card-text>
          {{ $t('pages.organization.confirmDeleteMemberMsg') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="deleteMemberDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="deleteMemberDialog = false;deleteMember(currentMember)">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editMemberDialog" max-width="500px">
      <v-card v-if="currentMember">
        <v-card-title primary-title>
          {{ $t('pages.organization.confirmEditMemberTitle', {name: currentMember.name}) }}
        </v-card-title>
        <v-card-text>
          <v-select :items="orga.roles" v-model="newRole" :label="$t('common.role')" />
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="editMemberDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="editMemberDialog = false;setMemberRole(currentMember, newRole)">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import eventBus from '../../event-bus'
export default {
  data: () => ({
    orga: null,
    valid: true,
    members: null,
    roles: null,
    q: '',
    deleteMemberDialog: false,
    editMemberDialog: false,
    currentMember: null,
    invitation: { id: null, email: null, role: null },
    inviteMemberDialog: false,
    validInvitation: true,
    membersPage: 1,
    membersPageSize: 10,
    newRole: null
  }),
  computed: {
    ...mapState(['userDetails']),
    isAdminOrga() {
      if (!this.userDetails) return false
      if (this.userDetails.isAdmin) return true
      return this.userDetails.organizations && this.userDetails.organizations.find(o => o.id === this.$route.params.id && o.role === 'admin')
    }
  },
  async mounted() {
    this.orga = await this.$axios.$get(`api/organizations/${this.$route.params.id}`)
    this.fetchMembers()
  },
  methods: {
    ...mapActions(['fetchUserDetails']),
    async save(e) {
      e.preventDefault()
      if (!this.$refs.form.validate()) return
      try {
        await this.$axios.$patch(`api/organizations/${this.$route.params.id}`,
          { name: this.orga.name, description: this.orga.description })
        eventBus.$emit('notification', this.$t('common.modificationOk'))
        this.fetchUserDetails()
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async fetchMembers() {
      try {
        this.members = await this.$axios.$get(`api/organizations/${this.$route.params.id}/members`,
          { params: { q: this.q, page: this.membersPage, size: this.membersPageSize } })
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async deleteMember(member) {
      try {
        await this.$axios.$delete(`api/organizations/${this.$route.params.id}/members/${member.id}`)
        eventBus.$emit('notification', this.$t('pages.organization.deleteMemberSuccess', { name: member.name }))
        this.fetchMembers()
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    newInvitation() {
      this.invitation = { id: this.orga.id, name: this.orga.name, email: '', role: null }
      this.$refs.inviteForm.reset()
    },
    async confirmInvitation() {
      if (this.$refs.inviteForm.validate()) {
        this.inviteMemberDialog = false
        try {
          await this.$axios.$post(`api/invitations/`, this.invitation)
          eventBus.$emit('notification', this.$t('pages.organization.inviteSuccess', { email: this.invitation.email }))
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      }
    },
    async setMemberRole(member, newRole) {
      member.role = newRole
      try {
        await this.$axios.patch(`api/organizations/${this.$route.params.id}/members/${member.id}`, { role: newRole })
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style lang="css">
</style>
