<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{on}">
      <v-btn
        :title="$t('pages.organization.addPartner')"
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
      v-if="editPartner"
      data-iframe-height
      :width="500"
      :loading="env.manageSites && !redirects"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.addPartner') }}
      </v-card-title>
      <v-card-text>
        <v-form
          ref="createForm"
          @submit.prevent
        >
          <v-text-field
            v-model="editPartner.name"
            :label="$t('common.orgName')"
            :rules="[v => !!v || '']"
            name="name"
            required
            dense
            outlined
            autocomplete="off"
          />
          <v-text-field
            v-model="editPartner.contactEmail"
            :label="$t('common.contactEmail')"
            :rules="[v => !!v || '']"
            name="contactEmail"
            required
            dense
            outlined
            autocomplete="off"
          />
          <v-select
            v-if="env.manageSites && redirects && redirects.filter(r => r.value !== editPartner.redirect).length"
            v-model="editPartner.redirect"
            label="Site de redirection"
            :items="redirects"
            name="host"
            required
            dense
            outlined
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click="menu = false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :disabled="env.manageSites && !redirects"
          @click="confirmCreate"
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
  props: ['orga'],
  data: () => ({ menu: false, editPartner: null, redirect: null }),
  computed: {
    ...mapState(['env', 'sites']),
    ...mapGetters(['redirects'])
  },
  watch: {
    menu () {
      if (!this.menu) return
      if (this.env.manageSites) this.$store.dispatch('fetchSites')
      this.editPartner = { name: '', contactEmail: '', redirect: this.redirect }
      if (this.$refs.createForm) this.$refs.createForm.reset()
    },
    redirects: {
      immediate: true,
      handler () {
        this.redirect = this.$route.query.redirect || (this.redirects && this.redirects[0] && this.redirects[0].value) || ''
        if (this.editPartner) this.editPartner.redirect = this.redirect
      }
    }
  },
  methods: {
    async confirmCreate () {
      if (this.$refs.createForm.validate()) {
        try {
          this.menu = false
          await this.$axios.$post(`api/organizations/${this.orga.id}/partners`, this.editPartner)
          eventBus.$emit('notification', this.$t('pages.organization.invitePartnerSuccess', { email: this.editPartner.contactEmail }))
          this.$emit('change')
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
