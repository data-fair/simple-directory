<template>
  <v-menu
    v-if="isAdminOrga && members && members.results"
    v-model="menu"
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.addMember')"
        fab
        size="small"
        color="primary"
        class="mx-2"
        v-bind="props"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </template>
    <v-card
      v-if="orga && menu"
      data-iframe-height
      width="500px"
      :loading="!invitation"
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
      <v-card-text v-else-if="invitation">
        <v-form
          v-if="!link"
          ref="inviteForm"
          v-model="validInvitation"
          @submit.prevent
        >
          <v-text-field
            id="id"
            v-model="invitation.email"
            :label="$t('pages.organization.inviteEmail')"
            :rules="[v => !!v || '']"
            name="email"
            required
            variant="outlined"
            density="compact"
            autocomplete="off"
          />
          <v-select
            v-model="invitation.role"
            :items="orga.roles"
            :label="$t('common.role')"
            :rules="[v => !!v || '']"
            name="role"
            variant="outlined"
            density="compact"
          />
          <v-autocomplete
            v-if="$uiConfig.manageDepartments && orga.departments && orga.departments.length && !department"
            v-model="invitation.department"
            :items="orga.departments"
            :label="orga.departmentLabel || $t('common.department')"
            item-value="id"
            item-title="name"
            name="department"
            clearable
            variant="outlined"
            density="compact"
          />
          <v-select
            v-if="$uiConfig.manageSites && redirects && redirects.filter(r => r.value !== defaultRedirect).length"
            v-model="invitation.redirect"
            :disabled="mainHost !== host"
            label="Site de redirection"
            :items="redirects"
            name="host"
            required
            density="compact"
            variant="outlined"
          />
        </v-form>
        <v-alert
          :value="!!link"
          type="warning"
          variant="outlined"
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
          variant="text"
          @click="menu=false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          :disabled="disableInvite || !invitation || !invitation.email || !invitation.role"
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
    link: null
  }),
  computed: {
    ...mapState(['env']),
    ...mapGetters(['redirects', 'host', 'mainHost']),
    defaultRedirect () {
      if (this.host === this.mainHost) {
        return this.redirects && this.redirects[0]
      } else {
        return (this.redirects && this.redirects.find(r => r.value && new URL(r.value).host === this.host))
      }
    }
  },
  watch: {
    async menu () {
      if (!this.menu) {
        this.invitation = null
        return
      }
      if (this.$uiConfig.manageSites) await this.$store.dispatch('fetchSites')
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
          if (!this.$uiConfig.alwaysAcceptInvitation) {
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
