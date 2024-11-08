<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.editDepartment', {departmentLabel})"
        variant="text"
        icon
        v-bind="props"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>

    <v-card
      v-if="editDepartment"
      data-iframe-height
      width="500"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.confirmEditDepartmentTitle', {name: department.name, departmentLabel}) }}
      </v-card-title>
      <v-card-text>
        <p>{{ $t('common.id') }} = {{ department.id }}</p>
        <load-avatar
          v-if="orga && $uiConfig.avatars.orgs"
          ref="loadAvatar"
          :owner="{type: 'organization', id: orga.id, department: department.id}"
          :disabled="$uiConfig.readonly"
          :hide-validate="true"
        />
        <v-text-field
          v-model="editDepartment.name"
          :label="$t('common.name')"
          :rules="[v => !!v || '']"
          name="name"
          required
        />
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
          color="primary"
          @click="confirmEdit"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { mapActions, mapState } from 'vuex'

export default {
  props: ['orga', 'department', 'departmentLabel'],
  data: () => ({ menu: false, editDepartment: null }),
  computed: {
    ...mapState(['env'])
  },
  watch: {
    menu () {
      if (!this.menu) return
      this.editDepartment = JSON.parse(JSON.stringify(this.department))
    }
  },
  methods: {
    ...mapActions(['patchOrganization']),
    async confirmEdit (department) {
      this.menu = false
      const departments = this.orga.departments.map(d => d.id === this.department.id ? this.editDepartment : d)
      await this.patchOrganization({ id: this.orga.id, patch: { departments }, msg: this.$t('common.modificationOk') })
      await this.$refs.loadAvatar.validate()
      this.$emit('change')
    }
  }
}
</script>

<style lang="css" scoped>
</style>
