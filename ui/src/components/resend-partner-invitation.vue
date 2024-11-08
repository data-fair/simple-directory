<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    
  >
    <template #activator="{props}">
      <v-btn
        icon
        color="warning"
        size="small"
        :title="$t('pages.organization.sendInvitationLink')"

        v-bind="props"
      >
        <v-icon>mdi-send</v-icon>
      </v-btn>
    </template>
    <v-card
      v-if="menu"
      data-iframe-height
      width="500px"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.sendInvitationLink') }}
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="partner.name"
          :label="$t('common.orgName')"
          :rules="[v => !!v || '']"
          name="name"
          required
          density="compact"
          variant="outlined"
          disabled
        />
        <v-text-field
          v-model="partner.contactEmail"
          :label="$t('common.contactEmail')"
          :rules="[v => !!v || '']"
          name="contactEmail"
          required
          density="compact"
          variant="outlined"
          disabled
        />
        <v-select
          v-if="$uiConfig.manageSites"
          v-model="redirect"
          label="Site de redirection"
          :items="redirects"
          :loading="!redirects"
          name="host"
          required
          density="compact"
          variant="outlined"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="menu=false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          color="warning"
          @click="confirmInvitation()"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { mapGetters, mapState } from 'vuex'
import eventBus from '../event-bus'

export default {
  props: {
    orga: { type: Object, required: true },
    partner: { type: Object, required: true }
  },
  data () {
    return {
      menu: false,
      redirect: null
    }
  },
  computed: {
    ...mapGetters(['redirects']),
    ...mapState(['env'])
  },
  mounted () {
    this.redirect = this.$route.query.redirect || ''
  },
  methods: {
    async confirmInvitation () {
      try {
        this.menu = false
        await this.$axios.$post(`api/organizations/${this.orga.id}/partners`, { name: this.partner.name, contactEmail: this.partner.contactEmail, redirect: this.redirect })
        eventBus.$emit('notification', t('pages.organization.invitePartnerSuccess', { email: this.partner.contactEmail }))
        this.$emit('change')
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style>

</style>
