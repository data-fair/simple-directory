<template lang="html">
  <v-container
    v-if="orga && userDetails"
    data-iframe-height
    style="max-width:600px;"
  >
    <h2 class="text-h4 mb-4">
      <v-icon
        large
        color="primary"
        style="top:-2px"
      >
        mdi-account-group
      </v-icon>
      {{ orga.name }} - {{ department.name }} ({{ department.id }})
    </h2>

    <load-avatar
      v-if="orga && env.avatars.orgs"
      :owner="{type: 'organization', id: orga.id, department: department.id}"
      :disabled="env.readonly"
    />

    <organization-members
      :orga="orga"
      :is-admin-orga="isAdminDepartment"
      :nb-members-limits="limits && limits.store_nb_members"
      :org-storage="'false'"
      :readonly="env.readonly"
      :admin-department="$route.params.departmentId"
    />
  </v-container>
</template>

<script>
import { mapState } from 'vuex'

export default {
  data: () => ({
    orga: null
  }),
  computed: {
    ...mapState(['userDetails', 'env']),
    ...mapState('session', ['user']),
    isAdminDepartment () {
      if (!this.user || !this.userDetails) return false
      if (this.user.adminMode) return true
      return !!(this.userDetails.organizations && this.userDetails.organizations.find(o => o.id === this.$route.params.id && o.role === 'admin' && o.department === this.$route.params.departmentId))
    },
    department () {
      if (!this.orga) return null
      return this.orga.departments.find(d => d.id === this.$route.params.departmentId)
    }
  },
  watch: {
    userDetails: {
      handler () {
        if (!this.userDetails) return
        // TODO: this is debatable, API allows to show all info on this page
        // but in term of functionality it doesn't make much sense
        if (!this.isAdminDepartment) this.$nuxt.error({ message: this.$t('errors.permissionDenied') })
      },
      immediate: true
    }
  },
  async mounted () {
    this.fetchLimits()
    this.fetchOrganization()
  },
  methods: {
    async fetchLimits () {
      if (!this.env.readonly) {
        this.limits = await this.$axios.$get(`api/limits/organization/${this.$route.params.id}`)
      }
    },
    async fetchOrganization () {
      const orga = await this.$axios.$get(`api/organizations/${this.$route.params.id}`)
      orga['2FA'] = orga['2FA'] || {}
      orga['2FA'].roles = orga['2FA'].roles || []
      this.orga = orga
    }
  }
}
</script>

<style lang="css">
</style>
