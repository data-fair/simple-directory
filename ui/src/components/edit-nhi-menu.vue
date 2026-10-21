<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.editNhi')"
        variant="text"
        :icon="mdiPencil"
        density="compact"
        v-bind="props"
      />
    </template>

    <v-card
      v-if="editNhi"
      data-iframe-height
      :width="500"
    >
      <v-card-title>
        {{ $t('pages.organization.editNhi') }}
      </v-card-title>
      <v-card-text>
        <load-avatar
          v-if="$uiConfig.avatars.users"
          :owner="{type: 'user', id: nhi.id}"
          class="mb-4"
        />
        <v-form
          ref="editForm"
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
            :items="roleItems"
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
          <template v-if="nhi.provider">
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
          </template>
          <v-combobox
            v-model="allowedIps"
            :label="$t('pages.organization.nhiAllowedIps')"
            :hint="$t('pages.organization.nhiAllowedIpsHint')"
            persistent-hint
            name="allowedIps"
            multiple
            chips
            closable-chips
            clearable
            density="compact"
            variant="outlined"
          />
          <v-checkbox
            v-model="ipBinding"
            :label="$t('pages.organization.nhiIpBinding')"
            :hint="$t('pages.organization.nhiIpBindingHint')"
            persistent-hint
            name="ipBinding"
            density="compact"
          />
          <v-autocomplete
            v-model="scopes"
            :items="scopeItems"
            item-props
            :label="$t('pages.organization.nhiScopes')"
            :hint="$t('pages.organization.nhiScopesHint')"
            persistent-hint
            name="scopes"
            multiple
            chips
            closable-chips
            clearable
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
          color="admin"
          variant="flat"
          @click="confirmEdit.execute()"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const { sendUiNotif } = useUiNotif()
const { t } = useI18n()

const { orga, nhi } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  nhi: { type: Object as () => any, required: true }
})
const { roleItems } = useRoleLabels(() => orga)
const { scopeItems } = usePlatformScopes()
const emit = defineEmits(['change'])

const menu = ref(false)
const editForm = ref<InstanceType<typeof VForm>>()
const newEditNhi = () => ({
  name: nhi.name,
  role: nhi.role,
  department: nhi.department as string | undefined,
  subject: nhi.subject,
  provider: { issuer: nhi.provider?.issuer }
})
// an nhi without key binding has none to edit
const newJwks = () => (nhi.provider?.jwks ? JSON.stringify(nhi.provider.jwks, null, 2) : '')
const editNhi = ref(newEditNhi())
const jwks = ref(newJwks())
const allowedIps = ref<string[]>([...(nhi.allowedIps ?? [])])
const ipBinding = ref(!!nhi.ipBinding)
const scopes = ref<string[]>([...(nhi.scopes ?? [])])

watch(menu, () => {
  if (!menu.value) return
  editNhi.value = newEditNhi()
  jwks.value = newJwks()
  allowedIps.value = [...(nhi.allowedIps ?? [])]
  ipBinding.value = !!nhi.ipBinding
  scopes.value = [...(nhi.scopes ?? [])]
  editForm.value?.reset()
})

const confirmEdit = useAsyncAction(async () => {
  await editForm.value?.validate()
  if (!editForm.value?.isValid) return

  const body: any = {
    name: editNhi.value.name,
    role: editNhi.value.role,
    department: editNhi.value.department || '',
    // null clears the restriction, an empty array is refused by the API on purpose
    allowedIps: allowedIps.value.map(ip => ip.trim()).filter(ip => !!ip),
    ipBinding: ipBinding.value,
    scopes: scopes.value
  }
  if (!body.allowedIps.length) body.allowedIps = null
  if (!body.scopes.length) body.scopes = null
  if (nhi.provider) {
    body.subject = editNhi.value.subject
    body.provider = { issuer: editNhi.value.provider.issuer }
  }
  if (nhi.provider && jwks.value.trim()) {
    try {
      body.provider.jwks = JSON.parse(jwks.value)
    } catch (err: any) {
      sendUiNotif({ type: 'error', msg: t('pages.organization.nhiJwksInvalid', { message: err.message }) })
      return
    }
  }

  menu.value = false
  await $fetch(`organizations/${orga.id}/nhis/${nhi.id}`, { method: 'PATCH', body })
  emit('change')
})
</script>

<style lang="css" scoped>
</style>
