<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.editDepartment', {departmentLabel})"
        variant="text"
        :icon="mdiPencil"
        v-bind="props"
      />
    </template>

    <v-card
      v-if="editDepartment"
      data-iframe-height
      :width="500"
    >
      <v-card-title>
        {{ $t('pages.organization.confirmEditDepartmentTitle', {name: department.name, departmentLabel}) }}
      </v-card-title>
      <v-card-text>
        <p>{{ $t('common.id') }} = {{ department.id }}</p>
        <load-avatar
          v-if="orga && $uiConfig.avatars.orgs"
          ref="avatar"
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
          :disabled="loading"
          @click="menu = false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="loading"
          @click="confirmEdit"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import debugModule from 'debug'

const loadAvatarDebug = debugModule('sd:load-avatar')

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
const avatar = ref<typeof import('./load-avatar.vue')['default']>()

watch(menu, () => {
  if (!menu.value) return
  editDepartment.value = JSON.parse(JSON.stringify(department))
})

watch(avatar, () => {
  loadAvatarDebug('avatar ref changed', avatar.value)
}, { immediate: true })

const loading = ref(false)

const confirmEdit = withUiNotif(async () => {
  loading.value = true
  const departments = (orga.departments ?? []).map(d => d.id === editDepartment.value?.id ? editDepartment.value : d)
  await patchOrganization.execute(orga.id, { departments }, t('common.modificationOk'))
  loadAvatarDebug('confirm edit department, load avatar ?', avatar.value)
  await avatar.value?.validate()
  emit('change')
  menu.value = false
  loading.value = false
})
</script>

<style lang="css" scoped>
</style>
