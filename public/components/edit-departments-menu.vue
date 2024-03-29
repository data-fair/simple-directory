<template>
  <v-menu
    v-if="isAdminOrga"
    v-model="menu"
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{on}">
      <v-btn
        :title="$t('pages.organization.addDepartment', {departmentLabel: departmentLabel.toLowerCase()})"
        fab
        small
        color="primary"
        class="mx-2"
        v-on="on"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>

    <v-card
      v-if="editDepartment"
      data-iframe-height
      :width="500"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.addDepartment', {departmentLabel: departmentLabel.toLowerCase()}) }}
      </v-card-title>
      <v-card-text>
        <v-form
          ref="createForm"
          @submit.prevent
        >
          <v-text-field
            v-model="editDepartment.id"
            :label="$t('common.id')"
            :rules="[v => !!v || '', v => v && !!v.match(/^[ a-zA-Z0-9]*$/) || $t('pages.organization.departmentIdInvalid')]"
            name="id"
            required
            dense
            outlined
          />
          <v-text-field
            v-model="editDepartment.name"
            :label="$t('common.name')"
            :rules="[v => !!v || '']"
            name="name"
            required
            dense
            outlined
          />
        </v-form>
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
          color="primary"
          @click="confirmCreate"
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
  props: ['orga', 'departmentLabel', 'isAdminOrga'],
  data: () => ({ menu: false, editDepartment: null }),
  watch: {
    menu () {
      if (!this.menu) return
      this.editDepartment = { id: '', name: '' }
      if (this.$refs.createForm) this.$refs.createForm.reset()
    }
  },
  methods: {
    ...mapActions(['patchOrganization']),
    async confirmCreate () {
      if (this.$refs.createForm.validate()) {
        this.menu = false
        const departments = this.orga.departments.concat([this.editDepartment])
        await this.patchOrganization({ id: this.orga.id, patch: { departments }, msg: this.$t('common.modificationOk') })
        this.$emit('change')
      }
    }
  }
}
</script>

<style lang="css" scoped>
</style>
