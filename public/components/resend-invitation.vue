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
        :title="$t('pages.organization.createUserLink')"
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
      <v-card-title
        v-if="!link"
        class="text-h6"
      >
        {{ $t('pages.organization.createUserLink') }}
      </v-card-title>
      <v-card-text>
        <template v-if="!link">
          <v-text-field
            v-model="invitation.email"
            :label="$t('pages.organization.inviteEmail')"
            name="email"
            disabled
            outlined
            dense
          />
          <v-select
            v-model="invitation.role"
            :items="orga.roles"
            :label="$t('common.role')"
            disabled
            outlined
            dense
          />
          <v-select
            v-if="invitation.department"
            v-model="invitation.department"
            :items="orga.departments"
            :label="orga.departmentLabel || $t('common.department')"
            item-value="id"
            item-text="name"
            disabled
            outlined
            dense
          />
        </template>
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
          :disabled="!invitation.email || !invitation.role"
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
    department: { type: String, default: null },
    member: { type: Object, required: true }
  },
  data () {
    return { menu: false, link: null }
  },
  watch: {
    menu (value) {
      if (!value) return
      const invitation = {
        id: this.orga.id,
        name: this.orga.name,
        email: this.member.email,
        role: this.member.role,
        redirect: this.$route.query.redirect
      }
      if (this.member.departments && this.member.departments.length) {
        invitation.department = this.member.departments[0].id
        invitation.role = this.member.departments[0].role
      }
      this.invitation = invitation
      this.link = null
    }
  },
  methods: {
    async confirmInvitation () {
      if (this.link) {
        this.menu = false
        return
      }
      try {
        const res = await this.$axios.$post('api/invitations/', this.invitation)
        if (res && res.link) {
          this.link = res.link
        } else {
          this.menu = false
        }
        this.$emit('sent', this.invitation)
        eventBus.$emit('notification', this.$t('pages.organization.inviteSuccess', { email: this.invitation.email }))
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style>

</style>
