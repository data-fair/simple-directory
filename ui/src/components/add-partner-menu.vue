<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-fab
        :title="$t('pages.organization.addPartner')"
        size="small"
        color="primary"
        class="mx-2"
        :icon="mdiPlus"
        v-bind="props"
      />
    </template>

    <v-card
      v-if="editPartner"
      data-iframe-height
      :width="500"
      :loading="$uiConfig.manageSites && !redirects"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.organization.addPartner') }}
      </v-card-title>
      <v-card-text>
        <v-form
          ref="createForm"
          @submit.prevent
        >
          <v-text-field
            v-model="editPartner.name"
            :label="$t('common.orgName')"
            :rules="[v => !!v || '']"
            name="name"
            required
            density="compact"
            variant="outlined"
            autocomplete="off"
          />
          <v-text-field
            v-model="editPartner.contactEmail"
            :label="$t('common.contactEmail')"
            :rules="[v => !!v || '']"
            name="contactEmail"
            required
            density="compact"
            variant="outlined"
            autocomplete="off"
          />
          <v-select
            v-if="$uiConfig.manageSites && redirects && redirects.filter(r => r.value !== editPartner.redirect).length"
            v-model="editPartner.redirect"
            label="Site de redirection"
            :items="redirects"
            name="host"
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
          :disabled="$uiConfig.manageSites && !redirects"
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

const { redirects, sitesFetch } = useStore()
const reactiveSearchParams = useReactiveSearchParams()
const { sendUiNotif } = useUiNotif()
const { t } = useI18n()

const { orga } = defineProps({
  orga: { type: Object as () => Organization, required: true }
})
const emit = defineEmits(['change'])

const menu = ref(false)
const redirect = ref('')
const createForm = ref<InstanceType<typeof VForm>>()
const newPartner = () => ({ name: '', contactEmail: '', redirect: redirect.value })
const editPartner = ref(newPartner())

watch(menu, () => {
  if (!menu.value) return
  if ($uiConfig.manageSites) sitesFetch.refresh()
  editPartner.value = newPartner()
  createForm.value?.reset()
})

watch(redirects, () => {
  redirect.value = reactiveSearchParams.redirect || (redirects.value?.[0]?.value) || ''
  editPartner.value.redirect = redirect.value
}, { immediate: true })

const confirmCreate = withUiNotif(async () => {
  if (await createForm.value?.validate()) {
    menu.value = false
    await $fetch(`organizations/${orga.id}/partners`, { method: 'POST', body: editPartner })
    sendUiNotif({ type: 'success', msg: t('pages.organization.invitePartnerSuccess', { email: editPartner.value.contactEmail }) })
    emit('change')
  }
})
</script>

<style lang="css" scoped>
</style>
