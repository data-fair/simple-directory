<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-fab
        :title="$t('pages.organization.addNhi')"
        size="small"
        color="primary"
        class="mx-2"
        :icon="mdiPlus"
        v-bind="props"
      />
    </template>

    <v-card
      data-iframe-height
      :width="500"
      :loading="!editNhi"
    >
      <v-card-title>
        {{ $t('pages.organization.addNhi') }}
      </v-card-title>
      <template v-if="editNhi">
        <v-card-text>
          <v-form
            ref="createForm"
            @submit.prevent
          >
            <v-text-field
              v-model="editNhi.name"
              :label="$t('common.name')"
              :rules="[v => !!v || '']"
              name="name"
              required
              density="compact"
              variant="outlined"
              autocomplete="off"
            />
            <v-select
              v-model="editNhi.role"
              :items="orga.roles"
              :label="$t('common.role')"
              :rules="[v => !!v || '']"
              name="role"
              required
              density="compact"
              variant="outlined"
            />
            <v-select
              v-if="$uiConfig.manageDepartments && orga.departments && orga.departments.length"
              v-model="editNhi.department"
              :items="orga.departments"
              :label="orga.departmentLabel || $t('common.department')"
              item-value="id"
              item-title="name"
              name="department"
              clearable
              density="compact"
              variant="outlined"
            />
            <v-text-field
              v-model="editNhi.provider.issuer"
              :label="$t('pages.organization.nhiIssuer')"
              :rules="[v => !!v || '']"
              name="issuer"
              required
              density="compact"
              variant="outlined"
              autocomplete="off"
            />
            <v-text-field
              v-model="editNhi.subject"
              :label="$t('pages.organization.nhiSubject')"
              :rules="[v => !!v || '']"
              name="subject"
              required
              density="compact"
              variant="outlined"
              autocomplete="off"
            />
            <v-textarea
              v-model="jwks"
              :label="$t('pages.organization.nhiJwks')"
              name="jwks"
              rows="4"
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
            variant="flat"
            @click="confirmCreate.execute()"
          >
            {{ $t('common.confirmOk') }}
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const { sendUiNotif } = useUiNotif()
const { t } = useI18n()

const { orga } = defineProps({
  orga: { type: Object as () => Organization, required: true }
})
const emit = defineEmits(['change'])

const menu = ref(false)
const createForm = ref<InstanceType<typeof VForm>>()
const newNhi = () => ({ name: '', role: '', department: undefined as string | undefined, subject: '', provider: { issuer: '' } })
const editNhi = ref(newNhi())
const jwks = ref('')

watch(menu, () => {
  if (!menu.value) return
  editNhi.value = newNhi()
  jwks.value = ''
  createForm.value?.reset()
})

const confirmCreate = useAsyncAction(async () => {
  await createForm.value?.validate()
  if (!createForm.value?.isValid) return

  const body: any = {
    name: editNhi.value.name,
    role: editNhi.value.role,
    subject: editNhi.value.subject,
    provider: { issuer: editNhi.value.provider.issuer }
  }
  if (editNhi.value.department) body.department = editNhi.value.department
  if (jwks.value.trim()) {
    try {
      body.provider.jwks = JSON.parse(jwks.value)
    } catch (err: any) {
      sendUiNotif({ type: 'error', msg: t('pages.organization.nhiJwksInvalid', { message: err.message }) })
      return
    }
  }

  menu.value = false
  await $fetch(`organizations/${orga.id}/nhis`, { method: 'POST', body })
  emit('change')
})
</script>

<style lang="css" scoped>
</style>
