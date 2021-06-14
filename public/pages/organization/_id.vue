<template lang="html">
  <v-container v-if="orga" data-iframe-height>
    <h2 class="text-h5 mb-3">
      {{ $t('common.organization') + ' ' + orga.name }}
    </h2>
    <v-subheader v-if="orga.created">
      {{ $t('common.createdPhrase', {name: orga.created.name, date: $d(new Date(orga.created.date))}) }}
    </v-subheader>
    <load-avatar
      v-if="orga"
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
        outline
      />
      <v-text-field
        v-if="env.manageDepartments && env.manageDepartmentLabel"
        v-model="orga.departmentLabel"
        :label="$t('pages.organization.departmentLabelTitle')"
        :disabled="!isAdminOrga || env.readonly"
        name="departmentLabel"
      >
        <v-tooltip slot="append-outer" left>
          <template #activator="{on}">
            <v-icon v-on="on">
              mdi-information
            </v-icon>
          </template>
          <div v-html="$t('pages.organization.departmentLabelHelp')" />
        </v-tooltip>
      </v-text-field>
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
    />
  </v-container>
</template>

<script>
  import { mapActions, mapState } from 'vuex'
  import OrganizationMembers from '~/components/organization-members.vue'
  import OrganizationDepartments from '~/components/organization-departments.vue'
  import LoadAvatar from '~/components/load-avatar.vue'

  export default {
    components: { OrganizationMembers, OrganizationDepartments, LoadAvatar },
    data: () => ({
      orga: null,
      limits: null,
      valid: true,
    }),
    computed: {
      ...mapState(['userDetails', 'env']),
      ...mapState('session', ['user']),
      isAdminOrga() {
        if (!this.user || !this.userDetails) return false
        if (this.user.adminMode) return true
        return !!(this.userDetails.organizations && this.userDetails.organizations.find(o => o.id === this.$route.params.id && o.role === 'admin'))
      },
    },
    async mounted() {
      this.fetchOrganization()
      this.fetchLimits()
    },
    methods: {
      ...mapActions(['patchOrganization']),
      async fetchOrganization() {
        this.orga = await this.$axios.$get(`api/organizations/${this.$route.params.id}`)
      },
      async fetchLimits() {
        if (!this.env.readonly) {
          this.limits = await this.$axios.$get(`api/limits/organization/${this.$route.params.id}`)
        }
      },
      async save(e) {
        e.preventDefault()
        if (!this.$refs.form.validate()) return
        const patch = { name: this.orga.name, description: this.orga.description }
        if (this.env.manageDepartments) patch.departmentLabel = this.orga.departmentLabel
        this.patchOrganization({ id: this.orga.id, patch, msg: this.$t('common.modificationOk') })
      },
    },
  }
</script>

<style lang="css">
</style>
