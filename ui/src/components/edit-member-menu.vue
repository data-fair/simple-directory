<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{on, attrs}">
      <v-btn
        :title="$t('pages.organization.editMember')"
        text
        icon
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>
    <v-card
      v-if="editMember"
      data-iframe-height
      width="500"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.confirmEditMemberTitle', {name: member.name}) }}
      </v-card-title>
      <v-card-text>
        <v-alert
          v-if="member.readOnly"
          type="warning"
          border="left"
          outlined
          dense
        >
          {{ $t('pages.organization.memberReadOnly') }}
        </v-alert>
        <template v-else>
          <v-select
            v-model="editMember.role"
            :items="orga.roles"
            :label="$t('common.role')"
            dense
            outlined
          />
          <v-autocomplete
            v-if="env.manageDepartments && orga.departments && orga.departments.length && !department"
            v-model="editMember.department"
            :items="orga.departments"
            :label="orga.departmentLabel || $t('common.department')"
            item-value="id"
            item-text="name"
            name="department"
            clearable
            outlined
            dense
          />
        </template>
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
          :disabled="member.readOnly"
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
  props: ['orga', 'member', 'department'],
  data: () => ({ menu: false, editMember: null }),
  computed: {
    ...mapState(['env'])
  },
  watch: {
    menu () {
      if (!this.menu) return
      this.editMember = { ...this.member }
    }
  }
}
</script>

<style lang="css" scoped>
</style>
