<template>
  <v-menu v-model="menu" :close-on-content-click="false" max-width="500px">
    <template v-slot:activator="{on}">
      <v-btn :title="$t('pages.organization.editDepartment', {departmentLabel})" flat icon v-on="on">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>

    <v-card v-if="editDepartment">
      <v-card-title primary-title>
        {{ $t('pages.organization.confirmEditDepartmentTitle', {name: department.name, departmentLabel}) }}
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="editDepartment.name"
          :label="$t('common.name')"
          :rules="[v => !!v || '']"
          name="name"
          required
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn flat @click="menu = false">{{ $t('common.confirmCancel') }}</v-btn>
        <v-btn color="primary" @click="confirmEdit">{{ $t('common.confirmOk') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { mapActions } from 'vuex'

export default {
  props: ['orga', 'department', 'departmentLabel'],
  data: () => ({ menu: false, editDepartment: null }),
  watch: {
    menu() {
      if (!this.menu) return
      this.editDepartment = JSON.parse(JSON.stringify(this.department))
    }
  },
  methods: {
    ...mapActions(['patchOrganization']),
    async confirmEdit(department) {
      this.menu = false
      const departments = this.orga.departments.map(d => d.id === this.department.id ? this.editDepartment : d)
      await this.patchOrganization({ id: this.orga.id, patch: { departments }, msg: this.$t('common.modificationOk') })
      this.$emit('change')
    }
  }
}
</script>

<style lang="css" scoped>
</style>
