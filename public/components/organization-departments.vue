<template>
  <v-container fluid class="pa-0">
    <v-layout row wrap class="mt-3">
      <h3 class="title my-3">
        {{ orga.departmentLabel || $t('common.departments') }} <span>({{ $n(orga.departments.length) }})</span>
      </h3>
      <v-btn v-if="isAdminOrga" :title="$t('pages.organization.addDepartment', {departmentLabel})" icon color="primary" @click="newDepartment(); createDialog = true">
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-layout>

    <v-list v-if="orga.departments.length" two-line class="elevation-1 mt-3">
      <template v-for="(department, i) in orga.departments">
        <v-list-tile :key="department.id">
          <v-list-tile-content>
            <v-list-tile-title>{{ department.name }}</v-list-tile-title>
            <v-list-tile-sub-title>{{ $t('common.id') }} = {{ department.id }}</v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action v-if="isAdminOrga">
            <v-btn :title="$t('pages.organization.editDepartment', {departmentLabel})" flat icon @click="edit(department)">
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-btn :title="$t('pages.organization.deleteDepartment', {departmentLabel})" flat icon color="warning" @click="e => {e.preventDefault();currentDepartment = department; deleteDialog = true}">
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-list-tile-action>
        </v-list-tile>
        <v-divider v-if="i + 1 < orga.departments.length" :key="i"/>
      </template>
    </v-list>

    <v-dialog v-model="createDialog" max-width="500px">
      <v-card v-if="currentDepartment">
        <v-card-title primary-title>
          {{ $t('pages.organization.addDepartment', {departmentLabel}) }}
        </v-card-title>
        <v-card-text>
          <v-form ref="createForm">
            <v-text-field
              v-model="currentDepartment.id"
              :label="$t('common.id')"
              :rules="[v => !!v || '', v => !v, v => !!v.match(/^[ a-zA-Z0-9]*$/) || $t('pages.organization.departmentIdInvalid')]"
              name="id"
              required
            />
            <v-text-field
              v-model="currentDepartment.name"
              :label="$t('common.name')"
              :rules="[v => !!v || '']"
              name="name"
              required
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="createDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="primary" @click="confirmCreate">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card v-if="currentDepartment">
        <v-card-title primary-title>
          {{ $t('pages.organization.confirmDeleteDepartmentTitle', {name: currentDepartment.name, departmentLabel}) }}
        </v-card-title>
        <v-card-text>
          {{ $t('pages.organization.confirmDeleteDepartmentMsg', {name: currentDepartment.name, departmentLabel}) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn flat @click="deleteDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="warning" @click="confirmDelete">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="500px">
      <v-card v-if="editDepartment">
        <v-card-title primary-title>
          {{ $t('pages.organization.confirmEditDepartmentTitle', {name: currentDepartment.name, departmentLabel}) }}
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
          <v-btn flat @click="editDialog = false">{{ $t('common.confirmCancel') }}</v-btn>
          <v-btn color="primary" @click="confirmEdit">{{ $t('common.confirmOk') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  props: {
    isAdminOrga: {
      type: Boolean,
      default: null
    },
    orga: {
      type: Object,
      default: null
    }
  },
  data: () => ({
    currentDepartment: null,
    editDepartment: null,
    createDialog: false,
    deleteDialog: false,
    editDialog: false
  }),
  computed: {
    ...mapState(['userDetails']),
    departmentLabel() {
      return this.orga.departmentLabel || this.$t('common.department')
    }
  },
  created() {
    this.orga.departments = this.orga.departments || []
  },
  methods: {
    ...mapActions(['patchOrganization']),
    newDepartment() {
      this.currentDepartment = { id: '', name: '' }
    },
    async confirmCreate() {
      if (this.$refs.createForm.validate()) {
        this.createDialog = false
        const departments = this.orga.departments.concat([this.currentDepartment])
        await this.patchOrganization({ id: this.orga.id, patch: { departments }, msg: this.$t('common.modificationOk') })
        this.$emit('change')
      }
    },
    edit(department) {
      this.currentDepartment = department
      this.editDepartment = { ...department }
      this.editDialog = true
    },
    async confirmEdit() {
      if (this.$refs.createForm.validate()) {
        this.editDialog = false
        const departments = this.orga.departments.map(d => d.id === this.editDepartment.id ? this.editDepartment : d)
        await this.patchOrganization({ id: this.orga.id, patch: { departments }, msg: this.$t('common.modificationOk') })
        this.$emit('change')
      }
    },
    async confirmDelete() {
      if (this.$refs.createForm.validate()) {
        this.deleteDialog = false
        const departments = this.orga.departments.filter(d => d.id !== this.currentDepartment.id)
        await this.patchOrganization({ id: this.orga.id, patch: { departments }, msg: this.$t('common.modificationOk') })
        this.$emit('change')
      }
    }
  }
}
</script>

<style lang="css" scoped>
</style>
