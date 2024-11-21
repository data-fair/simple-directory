<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.editDepartment', {departmentLabel})"
        variant="text"
        icon
        v-bind="props"
      >
        <v-icon :icon="mdiPencil" />
      </v-btn>
    </template>

    <v-card
      v-if="editDepartment"
      data-iframe-height
      width="500"
    >
      <v-card-title>
        {{ $t('pages.organization.confirmEditDepartmentTitle', {name: department.name, departmentLabel}) }}
      </v-card-title>
      <v-card-text>
        <p>{{ $t('common.id') }} = {{ department.id }}</p>
        <load-avatar
          v-if="orga && $uiConfig.avatars.orgs"
          :ref="loadAvatar"
          :owner="{type: 'organization', id: orga.id, department: department.id}"
          :disabled="$uiConfig.readonly"
          :hide-validate="true"
        />
        <v-text-field
          v-model="editDepartment.name"
          :label="$t('common.name')"
          :rules="[v => !!v || '']"
          name="name"
          required
        />
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
          color="primary"
          @click="confirmEdit"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
type Department = { id: string, name: string }

const { orga, department, departmentLabel } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  department: { type: Object as () => Department, required: true },
  departmentLabel: { type: String, required: true }
})
const emit = defineEmits(['change'])

const { patchOrganization } = useStore()
const { t } = useI18n()

const menu = ref(false)
const editDepartment = ref<Department>()
const loadAvatar = ref<any>()

watch(menu, () => {
  if (!menu.value) return
  editDepartment.value = JSON.parse(JSON.stringify(department))
})

const confirmEdit = withUiNotif(async () => {
  menu.value = false
  const departments = (orga.departments ?? []).map(d => d.id === editDepartment.value?.id ? editDepartment.value : d)
  await patchOrganization(orga.id, { departments }, t('common.modificationOk'))
  await loadAvatar.value?.validate()
  emit('change')
})

</script>

<style lang="css" scoped>
</style>
