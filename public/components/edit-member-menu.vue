<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    max-width="500px"
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
      v-if="editMember"
      data-iframe-height
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.confirmEditMemberTitle', {name: member.name}) }}
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="editMember.role"
          :items="orga.roles"
          :label="$t('common.role')"
        />
        <v-select
          v-if="env.manageDepartments && orga.departments && orga.departments.length"
          v-model="editMember.department"
          :items="orga.departments"
          :label="orga.departmentLabel || $t('common.department')"
          item-value="id"
          item-text="name"
          clearable
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
          @click="menu = false;$emit('save', editMember)"
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
  props: ['orga', 'member'],
  data: () => ({ menu: false, editMember: null }),
  computed: {
    ...mapState(['env'])
  },
  watch: {
    menu () {
      if (!this.menu) return
      this.editMember = JSON.parse(JSON.stringify(this.member))
    }
  }
}
</script>

<style lang="css" scoped>
</style>
