<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          size="small"
          color="primary"
          style="top:-2px"
          :icon="mdiFamilyTree"
        />
        {{ orga.departmentLabel || $t('common.departments') }} <span>({{ $n(orga.departments?.length ?? 0) }})</span>
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
      v-if="(orga.departments?.length ?? 0) > pageSize"
      dense
    >
      <v-col cols="4">
        <v-text-field
          v-model="q"
          :label="$t('common.search')"
          name="search"
          variant="solo"
          density="comfortable"
          :append-inner-icon="mdiMagnify"
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
          density="comfortable"
          :prepend-inner-icon="mdiSort"
          @update:model-value="filterDeps"
        />
      </v-col>
    </v-row>

    <v-list
      v-if="orga.departments?.length"
      class="py-0 mt-1 border-sm"
    >
      <template
        v-for="(department, i) in currentPage"
        :key="department.id"
      >
        <v-list-item>
          <template #prepend>
            <v-avatar>
              <v-img
                v-if="refreshingDepartment !== department.id"
                :src="`${$sdUrl}/api/avatars/organization/${orga.id}/${department.id}/avatar.png?t=${timestamp}`"
              />
            </v-avatar>
          </template>

          <v-list-item-title>{{ department.name }}</v-list-item-title>

          <template #append>
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
          </template>
        </v-list-item>
        <v-divider
          v-if="i + 1 < currentPage.length"
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

<script setup lang="ts">
const { isAdminOrga, orga } = defineProps({
  isAdminOrga: { type: Boolean, default: null },
  orga: { type: Object as () => Organization, default: null }
})
defineEmits(['change'])

const { t } = useI18n()

const pageSize = 10
const page = ref(1)
const q = ref('')
const validQ = ref('')
const refreshingDepartment = ref<string | null>(null)
const timestamp = ref(new Date().getTime())
const sort = ref('creation')
const sortItems = [
  { title: t('pages.organization.depSortCreation'), value: 'creation' },
  { title: t('pages.organization.depSortAlpha'), value: 'alpha' }
]

const writableDepartments = computed(() => isAdminOrga && !$uiConfig.readonly)
const departmentLabel = computed(() => orga.departmentLabel || t('common.department'))
const searchableDepartments = computed(() => {
  const searchableDepartments = (orga.departments || [])
    .map(department => ({ department, search: (department.id + ' ' + department.name).toLowerCase() }))
  if (sort.value === 'creation') searchableDepartments.reverse()
  if (sort.value === 'alpha') searchableDepartments.sort((d1, d2) => d1.department.name.localeCompare(d2.department.name))
  return searchableDepartments
})

const filteredDeps = computed(() => {
  if (!validQ.value) return searchableDepartments.value.map(d => d.department)
  else {
    const filteredDeps = []
    const q = validQ.value.toLowerCase()
    for (const dep of searchableDepartments.value) {
      if (dep.search.includes(q)) filteredDeps.push(dep.department)
    }
    return filteredDeps
  }
})

const currentPage = computed(() => filteredDeps.value?.slice((page.value - 1) * pageSize, page.value * pageSize))

watch(() => orga.departments, () => {
  if (filteredDeps.value.length <= (page.value - 1) * pageSize) page.value -= 1
})

const filterDeps = () => {
  page.value = 1
  validQ.value = q.value
}
const refreshDepartment = async (department: { id: string, name: string }) => {
  refreshingDepartment.value = department.id
  await nextTick()
  refreshingDepartment.value = null
  timestamp.value = new Date().getTime()
}
</script>

<style lang="css" scoped>
</style>
