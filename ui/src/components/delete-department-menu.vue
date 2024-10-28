<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.deleteDepartment', {departmentLabel})"
        variant="text"
        icon
        color="warning"
        v-bind="props"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </template>

    <v-card
      data-iframe-height
      width="500"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.confirmDeleteDepartmentTitle', {name: department.name, departmentLabel}) }}
      </v-card-title>
      <v-card-text>
        <p>{{ $t('common.id') }} = {{ department.id }}</p>
        <v-progress-circular
          v-if="!members"
          indeterminate
          color="primary"
        />
        <v-alert
          v-else-if="members.count"
          type="warning"
          variant="outlined"
        >
          {{ $t('pages.organization.deleteDepartmentHasMembers', {count: members.count.toLocaleString()}) }}
        </v-alert>
        <p v-else>
          {{ $t('pages.organization.confirmDeleteDepartmentMsg', {name: department.name, departmentLabel}) }}
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="menu = false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          :disabled="!members || !!members.count"
          color="warning"
          @click="confirmDelete"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  props: ['orga', 'department', 'departmentLabel'],
  data: () => ({ menu: false, members: null }),
  watch: {
    async menu () {
      this.members = null
      if (!this.menu) return
      this.members = await this.$axios.$get(`api/organizations/${this.orga.id}/members`, {
        params: {
          size: 0,
          department: this.department.id
        }
      })
    }
  },
  methods: {
    ...mapActions(['patchOrganization']),
    async confirmDelete () {
      this.menu = false
      const departments = this.orga.departments.filter(d => d.id !== this.department.id)
      await this.patchOrganization({ id: this.orga.id, patch: { departments }, msg: this.$t('common.modificationOk') })
      this.$emit('change')
    }
  }
}
</script>

<style lang="css" scoped>
</style>
