<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{on, attrs}">
      <v-btn
        icon
        color="warning"
        small
        :title="$t('pages.organization.sendInvitationLink')"
        v-bind="attrs"
        v-on="on"
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
          dense
          outlined
          disabled
        />
        <v-text-field
          v-model="partner.contactEmail"
          :label="$t('common.contactEmail')"
          :rules="[v => !!v || '']"
          name="contactEmail"
          required
          dense
          outlined
          disabled
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
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

<script>
import eventBus from '../event-bus'

export default {
  props: {
    orga: { type: Object, required: true },
    partner: { type: Object, required: true }
  },
  data () {
    return {
      menu: false
    }
  },
  methods: {
    async confirmInvitation () {
      try {
        this.menu = false
        await this.$axios.$post(`api/organizations/${this.orga.id}/partners`, { name: this.partner.name, contactEmail: this.partner.contactEmail })
        eventBus.$emit('notification', this.$t('pages.organization.invitePartnerSuccess', { email: this.partner.contactEmail }))
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
