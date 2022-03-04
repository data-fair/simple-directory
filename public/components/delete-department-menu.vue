<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    max-width="500px"
  >
    <template #activator="{on}">
      <v-btn
        :title="$t('pages.organization.deleteDepartment', {departmentLabel})"
        text
        icon
        color="warning"
        v-on="on"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </template>

    <v-card data-iframe-height>
      <v-card-title class="text-h6">
        {{ $t('pages.organization.confirmDeleteDepartmentTitle', {name: department.name, departmentLabel}) }}
      </v-card-title>
      <v-card-text>
        {{ $t('pages.organization.confirmDeleteDepartmentMsg', {name: department.name, departmentLabel}) }}
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
  data: () => ({ menu: false }),
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
