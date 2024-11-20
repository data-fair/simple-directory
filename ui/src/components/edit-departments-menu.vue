<template>
  <v-menu
    v-if="isAdminOrga"
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-fab
        :title="$t('pages.organization.addDepartment', {departmentLabel: departmentLabel.toLowerCase()})"
        size="small"
        color="primary"
        class="mx-2"
        :icon="mdiPencil"
        v-bind="props"
      />
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
            density="compact"
            variant="outlined"
          />
          <v-text-field
            v-model="editDepartment.name"
            :label="$t('common.name')"
            :rules="[v => !!v || '']"
            name="name"
            required
            density="compact"
            variant="outlined"
          />
        </v-form>
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
          @click="confirmCreate"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const { orga, departmentLabel, isAdminOrga } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  departmentLabel: { type: String, required: true },
  isAdminOrga: { type: Boolean, defaut: false }
})
const emit = defineEmits(['change'])

const { patchOrganization } = useStore()
const { t } = useI18n()

const createForm = ref<InstanceType<typeof VForm>>()
const menu = ref(false)
const newDepartment = { id: '', name: '' }
const editDepartment = ref({ ...newDepartment })

watch(menu, () => {
  if (!menu.value) return
  editDepartment.value = { ...newDepartment }
  createForm.value?.reset()
})

const confirmCreate = withUiNotif(async () => {
  await createForm.value?.validate()
  if (createForm.value?.isValid) {
    menu.value = false
    const departments = (orga.departments ?? []).concat([editDepartment.value])
    await patchOrganization(orga.id, { departments }, t('common.modificationOk'))
    emit('change')
  }
})
</script>

<style lang="css" scoped>
</style>
