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
      v-if="orga && menu"
      data-iframe-height
      width="500px"
    >
      <v-card-title
        v-if="!link"
        class="text-h6"
      >
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
            :rules="[v => !!v || '']"
            name="email"
            required
            outlined
            dense
            autocomplete="off"
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
          <v-autocomplete
            v-if="env.manageDepartments && orga.departments && orga.departments.length && !department"
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
          <v-select
            v-if="env.manageSites && redirects && redirects.filter(r => r.value !== defaultRedirect).length"
            v-model="invitation.redirect"
            :disabled="mainHost !== host"
            label="Site de redirection"
            :items="redirects"
            name="host"
            required
            dense
            outlined
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
import { mapState, mapGetters } from 'vuex'
import eventBus from '../event-bus'

export default {
  props: ['orga', 'isAdminOrga', 'members', 'disableInvite', 'department'],
  data: () => ({
    menu: false,
    invitation: null,
    validInvitation: true,
    link: null,
    defaultRedirect: null
  }),
  computed: {
    ...mapState(['env']),
    ...mapGetters(['redirects', 'host', 'mainHost'])
  },
  watch: {
    menu () {
      if (!this.menu) return
      if (this.env.manageSites) this.$store.dispatch('fetchSites')
      this.invitation = {
        id: this.orga.id,
        name: this.orga.name,
        email: '',
        role: null,
        department: this.department,
        redirect: this.defaultRedirect && this.defaultRedirect.value
      }
      this.link = null
      if (this.$refs.inviteForm) this.$refs.inviteForm.reset()
    },
    redirects: {
      handler () {
        if (this.host === this.mainHost) {
          this.defaultRedirect = this.redirects[0]
        } else {
          this.defaultRedirect = (this.redirects && this.redirects.find(r => r.value && new URL(r.value).host === this.host))
        }
        if (this.invitation) this.invitation.redirect = this.defaultRedirect && this.defaultRedirect.value
      }
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
          this.$emit('sent', this.invitation)
          if (!this.env.alwaysAcceptInvitation) {
            eventBus.$emit('notification', this.$t('pages.organization.inviteSuccess', { email: this.invitation.email }))
          }
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
