<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          large
          color="primary"
          style="top:-2px"
        >
          mdi-family-tree
        </v-icon>
        {{ orga.departmentLabel || $t('common.departments') }} <span>({{ $n(orga.departments.length) }})</span>
        <add-department-menu
          v-if="writableDepartments"
          :orga="orga"
          :department-label="departmentLabel"
          @change="$emit('change')"
        />
        <!--<edit-departments-menu
          v-if="writableDepartments"
          :orga="orga"
          :is-admin-orga="isAdminOrga"
          :department-label="departmentLabel"
          @change="$emit('change')"
        />-->
      </h2>
    </v-row>

    <v-row
      v-if="orga.departments.length > pageSize"
      dense
    >
      <v-col cols="4">
        <v-text-field
          v-model="q"
          :label="$t('common.search')"
          name="search"
          solo
          append-icon="mdi-magnify"
          clearable
          @click:clear="$nextTick(() => $nextTick(() => filterDeps()))"
          @click:append="filterDeps"
          @keyup.enter="filterDeps"
        />
      </v-col>
      <v-col cols="4" />
      <v-col cols="4">
        <v-select
          v-model="sort"
          :items="sortItems"
          name="sort"
          prepend-inner-icon="mdi-sort"
          @change="filterDeps"
        />
      </v-col>
    </v-row>

    <v-list
      v-if="orga.departments.length"
      class="elevation-1 mt-1"
    >
      <template v-for="(department, i) in currentPage">
        <v-list-item :key="department.id">
          <v-list-item-avatar>
            <v-img
              v-if="refreshingDepartment !== department.id"
              :src="`${env.publicUrl}/api/avatars/organization/${orga.id}/${department.id}/avatar.png?t=${timestamp}`"
            />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>{{ department.name }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action v-if="writableDepartments">
            <edit-department-menu
              :orga="orga"
              :department="department"
              :department-label="departmentLabel"
              @change="$emit('change');refreshDepartment(department)"
            />
          </v-list-item-action>
          <v-list-item-action
            v-if="writableDepartments"
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
          v-if="i + 1 < currentPage.length"
          :key="'div-' + i"
        />
      </template>
    </v-list>

    <v-row
      v-if="(orga.departments && filteredDeps.length > pageSize) || page > 1"
      class="mt-2"
    >
      <v-spacer />
      <v-pagination
        v-model="page"
        :length="Math.ceil(filteredDeps.length / pageSize)"
      />
    </v-row>
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
  data () {
    return {
      pageSize: 10,
      page: 1,
      q: '',
      validQ: '',
      refreshingDepartment: null,
      timestamp: new Date().getTime(),
      sort: 'creation',
      sortItems: [
        { text: this.$t('pages.organization.depSortCreation'), value: 'creation' },
        { text: this.$t('pages.organization.depSortAlpha'), value: 'alpha' }
      ]
    }
  },
  computed: {
    ...mapState(['userDetails', 'env']),
    writableDepartments () {
      return this.isAdminOrga && (!this.env.readonly || this.env.overwrite.includes('departments'))
    },
    departmentLabel () {
      return this.orga.departmentLabel || this.$t('common.department')
    },
    searchableDepartments () {
      const searchableDepartments = (this.orga.departments || [])
        .map(department => ({ department, search: (department.id + ' ' + department.name).toLowerCase() }))
      if (this.sort === 'creation') searchableDepartments.reverse()
      if (this.sort === 'alpha') searchableDepartments.sort((d1, d2) => d1.department.name.localeCompare(d2.department.name))
      return searchableDepartments
    },
    filteredDeps () {
      if (!this.validQ) return this.searchableDepartments.map(d => d.department)
      else {
        const filteredDeps = []
        const q = this.validQ.toLowerCase()
        for (const dep of this.searchableDepartments) {
          if (dep.search.includes(q)) filteredDeps.push(dep.department)
        }
        return filteredDeps
      }
    },
    currentPage () {
      return this.filteredDeps.slice((this.page - 1) * this.pageSize, this.page * this.pageSize)
    }
  },
  watch: {
    'orga.departments' () {
      if (this.filteredDeps.length <= (this.page - 1) * this.pageSize) this.page -= 1
    }
  },
  created () {
    // eslint-disable-next-line vue/no-mutating-props
    this.orga.departments = this.orga.departments || []
  },
  methods: {
    filterDeps (page) {
      this.page = 1
      this.validQ = this.q
    },
    async refreshDepartment (department) {
      this.refreshingDepartment = department.id
      await this.$nextTick()
      this.refreshingDepartment = null
      this.timestamp = new Date().getTime()
    }
  }
}
</script>

<style lang="css" scoped>
</style>
