<template lang="html">
  <v-container
    v-if="orga && userDetails"
    data-iframe-height
    style="max-width:600px;"
  >
    <h2 class="text-h4 mb-4">
      <v-icon
        size="large"
        color="primary"
        style="top:-2px"
      >
        mdi-account-group
      </v-icon>
      {{ $t('common.organization') + ' ' + orga.name }}
    </h2>

    <v-subheader v-if="orga.created">
      {{ $t('common.createdPhrase', {name: orga.created.name, date: $d(new Date(orga.created.date))}) }}
    </v-subheader>
    <v-form
      ref="form"
      lazy-validation
      @submit="save"
    >
      <load-avatar
        v-if="orga && $uiConfig.avatars.orgs"
        :owner="{...orga, type: 'organization'}"
        :disabled="$uiConfig.readonly"
      />
      <v-text-field
        v-model="orga.name"
        :label="$t('common.name')"
        :rules="[v => !!v || '', v => v.length < 150 || $t('common.tooLong')]"
        :disabled="!isAdminOrga || $uiConfig.readonly"
        name="name"
        required
        variant="outlined"
        density="compact"
        autocomplete="off"
      />
      <v-textarea
        v-model="orga.description"
        :label="$t('common.description')"
        :disabled="!isAdminOrga || $uiConfig.readonly"
        name="description"
        hide-details
        variant="outlined"
        autocomplete="off"
      />
      <v-text-field
        v-if="$uiConfig.manageDepartments && $uiConfig.manageDepartmentLabel"
        v-model="orga.departmentLabel"
        :label="$t('pages.organization.departmentLabelTitle')"
        :disabled="!isAdminOrga || $uiConfig.readonly"
        name="departmentLabel"
        autocomplete="off"
      >
        <template #append>
          <v-tooltip

            location="left"
          >
            <template #activator="{props}">
              <v-icon v-bind="props">
                mdi-information
              </v-icon>
            </template>
            <div v-html="$t('pages.organization.departmentLabelHelp')" />
          </v-tooltip>
        </template>
      </v-text-field>
      <v-select
        v-model="orga['2FA'].roles"
        :items="orga.roles"
        :messages="[$t('pages.organization.2FARolesMsg')]"
        :rules="[v => !!v || '']"
        :placeholder="$t('pages.organization.2FARoles')"
        multiple
        name="2FARoles"
        style="max-width:600px"
      />

      <v-row class="mx-0 mb-0 mt-4">
        <v-spacer />
        <v-btn
          color="primary"
          @click="save"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-row>
    </v-form>

    <organization-departments
      v-if="$uiConfig.manageDepartments"
      :orga="orga"
      :is-admin-orga="isAdminOrga"
      @change="fetchOrganization"
    />
    <organization-members
      :orga="orga"
      :is-admin-orga="isAdminOrga"
      :nb-members-limits="limits && limits.store_nb_members"
      :org-storage="'false'"
      :readonly="$uiConfig.readonly"
    />

    <organization-storage
      v-if="(user.adminMode && $uiConfig.perOrgStorageTypes.length) || (orga.orgStorage && orga.orgStorage.active)"
      :orga="orga"
    />

    <organization-members
      v-if="orga.orgStorage && orga.orgStorage.active"
      :orga="orga"
      :is-admin-orga="isAdminOrga"
      :nb-members-limits="limits && limits.store_nb_members"
      :org-storage="'true'"
      :readonly="orga.orgStorage.readonly"
    />

    <organization-partners
      v-if="$uiConfig.managePartners && mainHost === host"
      :orga="orga"
      :is-admin-orga="isAdminOrga"
      @change="fetchOrganization"
    />
  </v-container>
</template>

<script setup lang="ts">
import { mapActions, mapState, mapGetters } from 'vuex'
import LoadAvatar from '~/components/load-avatar.vue'

export default {
  components: { LoadAvatar },
  data: () => ({
    orga: null,
    limits: null,
    valid: true
  }),
  computed: {
    ...mapState(['userDetails', 'env']),
    ...mapState('session', ['user']),
    ...mapGetters(['host', 'mainHost']),
    isAdminOrga () {
      if (!this.user || !this.userDetails) return false
      if (this.user.adminMode) return true
      if (this.$uiConfig.depAdminIsOrgAdmin) {
        return !!(this.userDetails.organizations && this.userDetails.organizations.find(o => o.id === this.$route.params.id && o.role === 'admin'))
      } else {
        return !!(this.userDetails.organizations && this.userDetails.organizations.find(o => o.id === this.$route.params.id && o.role === 'admin' && !o.department))
      }
    }
  },
  watch: {
    userDetails: {
      handler () {
        if (!this.userDetails) return
        // TODO: this is debatable, API allows to show all info on this page
        // but in term of functionality it doesn't make much sense
        if (!this.isAdminOrga) uiNotif.sendUiNotif({ error: t('errors.permissionDenied') })
      },
      immediate: true
    }
  },
  async mounted () {
    this.fetchOrganization()
    this.fetchLimits()
  },
  methods: {
    ...mapActions(['patchOrganization']),
    async fetchOrganization () {
      const orga = await this.$axios.$get(`api/organizations/${this.$route.params.id}`)
      orga['2FA'] = orga['2FA'] || {}
      orga['2FA'].roles = orga['2FA'].roles || []
      this.orga = orga
    },
    async fetchLimits () {
      if (!this.$uiConfig.readonly) {
        this.limits = await this.$axios.$get(`api/limits/organization/${this.$route.params.id}`)
      }
    },
    async save (e) {
      if (e.preventDefault) e.preventDefault()
      if (!this.$refs.form.validate()) return
      const patch = { name: this.orga.name, description: this.orga.description, '2FA': this.orga['2FA'] }
      if (this.$uiConfig.manageDepartments) patch.departmentLabel = this.orga.departmentLabel
      this.patchOrganization({ id: this.orga.id, patch, msg: t('common.modificationOk') })
    }
  }
}
</script>

<style lang="css">
</style>
