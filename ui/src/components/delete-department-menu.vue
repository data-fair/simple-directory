<template>
  <confirm-menu
    v-model="menu"
    :title="$t('pages.organization.confirmDeleteDepartmentTitle', {name: department.name, departmentLabel})"
    :disabled="!members || !!members.count || patchOrganization.loading.value"
    yes-color="warning"
    @confirm="confirmDelete.execute()"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.deleteDepartment', {departmentLabel})"
        :aria-label="$t('pages.organization.deleteDepartment', {departmentLabel})"
        variant="text"
        icon
        color="warning"
        v-bind="props"
      >
        <v-icon :icon="mdiDelete" />
      </v-btn>
    </template>
    <p>{{ $t('common.id') }} = {{ department.id }}</p>
    <v-progress-circular
      v-if="!members"
      indeterminate
      color="primary"
    />
    <v-alert
      v-else-if="members.count"
      type="warning"
      variant="outlined"
    >
      {{ $t('pages.organization.deleteDepartmentHasMembers', {count: members.count.toLocaleString()}) }}
    </v-alert>
    <p v-else>
      {{ $t('pages.organization.confirmDeleteDepartmentMsg', {name: department.name, departmentLabel}) }}
    </p>
  </confirm-menu>
</template>

<script setup lang="ts">

const { orga, department, departmentLabel } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  department: { type: Object as () => { id: string, name: string }, required: true },
  departmentLabel: { type: String, required: true }
})
const emit = defineEmits(['change'])

const { patchOrganization } = useStore()
const { t } = useI18n()

const menu = ref(false)

watch(menu, async () => {
  if (!menu.value) {
    fetchMembers.data.value = null
    return
  }
  fetchMembers.refresh()
})

const fetchMembers = useFetch<{ count: number, results: any[] }>(
  () => `${$apiPath}/organizations/${orga.id}/members`,
  {
    query: computed(() => ({ size: 0, department: department.id })),
    watch: false,
  }
)
const members = computed(() => fetchMembers.data.value)

const confirmDelete = useAsyncAction(async () => {
  const departments = (orga.departments ?? []).filter(d => d.id !== department.id)
  await patchOrganization.execute(orga.id, { departments }, t('common.modificationOk'))
  emit('change')
})
</script>

<style lang="css" scoped>
</style>
