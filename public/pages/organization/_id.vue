<template lang="html">
  <v-container
    v-if="orga && userDetails"
    data-iframe-height
    :fluid="$route.query.fluid === 'true'"
    :class="{'pa-0': $route.query.fluid === 'true'}"
  >
    <h2 class="text-h5 mb-3">
      {{ $t('common.organization') + ' ' + orga.name }}
    </h2>
    <v-subheader v-if="orga.created">
      {{ $t('common.createdPhrase', {name: orga.created.name, date: $d(new Date(orga.created.date))}) }}
    </v-subheader>
    <load-avatar
      v-if="orga && env.avatars.orgs"
      :owner="{...orga, type: 'organization'}"
      :disabled="env.readonly"
    />
    <v-form
      ref="form"
      v-model="valid"
      lazy-validation
      @submit="save"
    >
      <v-text-field
        v-model="orga.name"
        :label="$t('common.name')"
        :rules="[v => !!v || '']"
        :disabled="!isAdminOrga || env.readonly"
        name="name"
        required
      />
      <v-textarea
        v-model="orga.description"
        :label="$t('common.description')"
        :disabled="!isAdminOrga || env.readonly"
        name="description"
        outlined
      />
      <v-text-field
        v-if="env.manageDepartments && env.manageDepartmentLabel"
        v-model="orga.departmentLabel"
        :label="$t('pages.organization.departmentLabelTitle')"
        :disabled="!isAdminOrga || env.readonly"
        name="departmentLabel"
      >
        <v-tooltip
          slot="append-outer"
          left
        >
          <template #activator="{on}">
            <v-icon v-on="on">
              mdi-information
            </v-icon>
          </template>
          <div v-html="$t('pages.organization.departmentLabelHelp')" />
        </v-tooltip>
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
      <v-row>
        <v-spacer />
        <v-btn
          v-if="isAdminOrga && !env.readonly"
          color="primary"
          type="submit"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-row>
    </v-form>
    <organization-departments
      v-if="env.manageDepartments"
      :orga="orga"
      :is-admin-orga="isAdminOrga"
      @change="fetchOrganization"
    />
    <organization-members
      :orga="orga"
      :is-admin-orga="isAdminOrga"
      :nb-members-limits="limits && limits.store_nb_members"
      :org-storage="'false'"
      :readonly="env.readonly"
    />
    <organization-storage
      v-if="(user.adminMode && env.perOrgStorageTypes.length) || (orga.orgStorage && orga.orgStorage.active)"
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
  </v-container>
</template>

<script>
import { mapActions, mapState } from 'vuex'
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
    isAdminOrga () {
      if (!this.user || !this.userDetails) return false
      if (this.user.adminMode) return true
      return !!(this.userDetails.organizations && this.userDetails.organizations.find(o => o.id === this.$route.params.id && o.role === 'admin'))
    }
  },
  watch: {
    userDetails: {
      handler () {
        if (!this.userDetails) return
        // TODO: this is debatable, API allows to show all info on this page
        // but in term of functionality it doesn't make much sense
        if (!this.isAdminOrga) this.$nuxt.error({ message: this.$t('errors.permissionDenied') })
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
      if (!this.env.readonly) {
        this.limits = await this.$axios.$get(`api/limits/organization/${this.$route.params.id}`)
      }
    },
    async save (e) {
      e.preventDefault()
      if (!this.$refs.form.validate()) return
      const patch = { name: this.orga.name, description: this.orga.description, '2FA': this.orga['2FA'] }
      if (this.env.manageDepartments) patch.departmentLabel = this.orga.departmentLabel
      this.patchOrganization({ id: this.orga.id, patch, msg: this.$t('common.modificationOk') })
    }
  }
}
</script>

<style lang="css">
</style>
