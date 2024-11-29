<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.deleteDepartment', {departmentLabel})"
        variant="text"
        icon
        color="warning"
        v-bind="props"
      >
        <v-icon :icon="mdiDelete" />
      </v-btn>
    </template>

    <v-card
      data-iframe-height
      width="500"
    >
      <v-card-title>
        {{ $t('pages.organization.confirmDeleteDepartmentTitle', {name: department.name, departmentLabel}) }}
      </v-card-title>
      <v-card-text>
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
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="menu = false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          :disabled="!members || !!members.count || patchOrganization.loading.value"
          color="warning"
          variant="flat"
          @click="confirmDelete"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
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
const members = ref<any>()

watch(menu, async () => {
  if (!menu.value) {
    members.value = null
    return
  }
  fetchMembers()
})

const fetchMembers = withUiNotif(async () => {
  members.value = await $fetch(`organizations/${orga.id}/members`, {
    query: {
      params: {
        size: 0,
        department: department.id
      }
    }
  })
})

const confirmDelete = withUiNotif(async () => {
  menu.value = false
  const departments = (orga.departments ?? []).filter(d => d.id !== department.id)
  await patchOrganization.execute(orga.id, { departments }, t('common.modificationOk'))
  emit('change')
})
</script>

<style lang="css" scoped>
</style>
