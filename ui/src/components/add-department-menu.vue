<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-fab
        :title="$t('pages.organization.addDepartment', {departmentLabel: departmentLabel.toLowerCase()})"
        size="small"
        color="primary"
        class="mx-2"
        :icon="mdiPlus"
        v-bind="props"
      />
    </template>

    <v-card
      v-if="editDepartment"
      data-iframe-height
      :width="500"
    >
      <v-card-title>
        {{ $t('pages.organization.addDepartment', {departmentLabel: departmentLabel.toLowerCase()}) }}
      </v-card-title>
      <v-card-text>
        <v-form
          ref="createForm"
          @submit.prevent
        >
          <v-text-field
            v-model="editDepartment.name"
            :label="$t('common.name')"
            :rules="[v => !!v || '']"
            name="name"
            required
            density="compact"
            variant="outlined"
            autocomplete="off"
            @keyup.enter="confirmCreate"
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
import { Organization } from '#api/types'

const i18n = useI18n()
const { patchOrganization } = useStore()

const { orga, departmentLabel } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  departmentLabel: { type: String, required: true }
})
const emit = defineEmits(['change'])

const menu = ref(false)
const createForm = ref<InstanceType<typeof VForm>>()
const emptyDepartment = { id: '', name: '' }
const editDepartment = ref({ ...emptyDepartment })

watch(menu, () => {
  if (!menu.value) return
  editDepartmentMenu.value = { ...emptyDepartment }
  createForm.value?.reset()
})

const confirmCreate = async () => {
  await createForm.value?.validate()
  if (createForm.value?.isValid) {
    menu.value = false
    const departments = (orga.departments ?? []).concat([editDepartment.value])
    await patchOrganization(orga.id, { departments }, i18n.t('common.modificationOk'))
    emit('change')
  }
}

</script>

<style lang="css" scoped>
</style>
