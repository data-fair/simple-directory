<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{on}">
      <v-btn
        :title="$t('pages.organization.editMember')"
        text
        icon
        v-on="on"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>
    <v-card
      v-if="editRole"
      data-iframe-height
      width="500"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.confirmEditMemberTitle', {name: member.name}) }}
      </v-card-title>
      <v-card-text>
        <v-autocomplete
          v-if="env.manageDepartments && orga.departments && orga.departments.length && department"
          :value="department"
          :items="orga.departments"
          :label="orga.departmentLabel || $t('common.department')"
          item-value="id"
          item-text="name"
          clearable
          dense
          outlined
          disabled
        />
        <v-select
          v-model="editRole"
          :items="orga.roles"
          :label="$t('common.role')"
          dense
          outlined
        />
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
          @click="menu = false;$emit('save', {role: editRole, department: department})"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { mapState } from 'vuex'

export default {
  props: ['orga', 'member', 'department', 'role'],
  data: () => ({ menu: false, editRole: null }),
  computed: {
    ...mapState(['env'])
  },
  watch: {
    menu () {
      if (!this.menu) return
      this.editRole = this.role
    }
  }
}
</script>

<style lang="css" scoped>
</style>
