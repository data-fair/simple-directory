<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-row class="mt-3 mx-0">
      <h3 class="text-h6 my-3">
        {{ orga.departmentLabel || $t('common.departments') }} <span>({{ $n(orga.departments.length) }})</span>
      </h3>
      <add-department-menu
        v-if="!env.readonly"
        :orga="orga"
        :is-admin-orga="isAdminOrga"
        :department-label="departmentLabel"
        @change="$emit('change')"
      />
    </v-row>

    <v-list
      v-if="orga.departments.length"
      two-line
      class="elevation-1 mt-3"
    >
      <template v-for="(department, i) in orga.departments">
        <v-list-item :key="department.id">
          <v-list-item-content>
            <v-list-item-title>{{ department.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ $t('common.id') }} = {{ department.id }}</v-list-item-subtitle>
          </v-list-item-content>
          <v-list-item-action v-if="isAdminOrga && !env.readonly">
            <edit-department-menu
              :orga="orga"
              :department="department"
              :department-label="departmentLabel"
              @change="$emit('change')"
            />
          </v-list-item-action>
          <v-list-item-action
            v-if="isAdminOrga && !env.readonly"
            class="ml-0"
          >
            <delete-department-menu
              :orga="orga"
              :department="department"
              :department-label="departmentLabel"
              @change="$emit('change')"
            />
          </v-list-item-action>
        </v-list-item>
        <v-divider
          v-if="i + 1 < orga.departments.length"
          :key="i"
        />
      </template>
    </v-list>
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import AddDepartmentMenu from '~/components/add-department-menu.vue'
import EditDepartmentMenu from '~/components/edit-department-menu.vue'
import DeleteDepartmentMenu from '~/components/delete-department-menu.vue'

export default {
  components: { AddDepartmentMenu, EditDepartmentMenu, DeleteDepartmentMenu },
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
  data: () => ({}),
  computed: {
    ...mapState(['userDetails', 'env']),
    departmentLabel () {
      return this.orga.departmentLabel || this.$t('common.department')
    }
  },
  created () {
    // eslint-disable-next-line vue/no-mutating-props
    this.orga.departments = this.orga.departments || []
  }
}
</script>

<style lang="css" scoped>
</style>
