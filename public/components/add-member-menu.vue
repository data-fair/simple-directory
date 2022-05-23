<template>
  <v-menu
    v-if="isAdminOrga && members && members.results"
    v-model="menu"
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{on}">
      <v-btn
        :title="$t('pages.organization.addMember')"
        fab
        small
        color="primary"
        class="mx-2"
        v-on="on"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </template>
    <v-card
      v-if="orga"
      data-iframe-height
      :width="link ? '800px' : '500px'"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.addMember') }}
      </v-card-title>
      <v-card-text v-if="disableInvite">
        <v-alert
          :value="true"
          type="warning"
        >
          {{ $t('pages.organization.disableInvite') }}
        </v-alert>
      </v-card-text>
      <v-card-text v-else>
        <v-form
          v-if="!link"
          ref="inviteForm"
          v-model="validInvitation"
        >
          <v-text-field
            id="id"
            v-model="invitation.email"
            :label="$t('pages.organization.inviteEmail')"
            :rules="[v => !!v || '', v => !members.results.find(m => m.email === v) || $t('pages.organization.memberConflict')]"
            name="email"
            required
            outlined
            dense
          />
          <v-select
            v-model="invitation.role"
            :items="orga.roles"
            :label="$t('common.role')"
            :rules="[v => !!v || '']"
            name="role"
            outlined
            dense
          />
          <v-select
            v-if="env.manageDepartments && orga.departments && orga.departments.length"
            v-model="invitation.department"
            :items="orga.departments"
            :label="orga.departmentLabel || $t('common.department')"
            item-value="id"
            item-text="name"
            name="department"
            clearable
            outlined
            dense
          />
        </v-form>
        <v-alert
          :value="!!link"
          type="warning"
          outlined
        >
          <p>{{ $t('pages.organization.inviteLink') }}</p>
          <p style="word-break: break-all;">
            {{ link }}
          </p>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="!link"
          text
          @click="menu=false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          :disabled="disableInvite || !invitation.email || !invitation.role"
          color="warning"
          @click="confirmInvitation()"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { mapState } from 'vuex'
import eventBus from '../event-bus'

export default {
  props: ['orga', 'isAdminOrga', 'members', 'disableInvite'],
  data: () => ({
    menu: false,
    invitation: { id: null, email: null, role: null, department: null, redirect: null },
    validInvitation: true,
    link: null
  }),
  computed: {
    ...mapState(['env'])
  },
  watch: {
    menu () {
      if (!this.menu) return
      this.invitation = { id: this.orga.id, name: this.orga.name, email: '', role: null, department: null, redirect: this.$route.query.redirect }
      this.link = null
      if (this.$refs.inviteForm) this.$refs.inviteForm.reset()
    }
  },
  methods: {
    async confirmInvitation () {
      if (this.link) {
        this.menu = false
        return
      }
      if (this.$refs.inviteForm.validate()) {
        try {
          const res = await this.$axios.$post('api/invitations/', this.invitation)
          if (res && res.link) {
            this.link = res.link
          } else {
            this.menu = false
          }
          eventBus.$emit('notification', this.$t('pages.organization.inviteSuccess', { email: this.invitation.email }))
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      }
    }
  }
}
</script>

<style lang="css" scoped>
</style>
