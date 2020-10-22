<template>
  <v-menu v-model="menu" :close-on-content-click="false" max-width="500px">
    <template v-slot:activator="{on}">
      <v-btn :title="$t('pages.organization.editMember')" flat icon v-on="on">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>
    <v-card v-if="editMember">
      <v-card-title primary-title>
        {{ $t('pages.organization.confirmEditMemberTitle', {name: member.name}) }}
      </v-card-title>
      <v-card-text>
        <v-select :items="orga.roles" v-model="editMember.role" :label="$t('common.role')" />
        <v-select
          v-if="env.manageDepartments && orga.departments && orga.departments.length"
          :items="orga.departments"
          v-model="editMember.department"
          :label="orga.departmentLabel || $t('common.department')"
          item-value="id"
          item-text="name"
          clearable
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn flat @click="menu = false">{{ $t('common.confirmCancel') }}</v-btn>
        <v-btn color="warning" @click="menu = false;$emit('save', member)">{{ $t('common.confirmOk') }}</v-btn>
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
    menu() {
      if (!this.menu) return
      this.editMember = JSON.parse(JSON.stringify(this.member))
    }
  }
}
</script>

<style lang="css" scoped>
</style>
