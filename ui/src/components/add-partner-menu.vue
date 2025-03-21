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
      data-iframe-height
      :width="500"
      :loading="!editPartner || loadingRedirects"
    >
      <v-card-title>
        {{ $t('pages.organization.addPartner') }}
      </v-card-title>
      <template v-if="editPartner && !loadingRedirects">
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
              v-if="redirects && redirects.length > 1"
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
            variant="flat"
            @click="confirmCreate"
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

const { redirects, loadingRedirects } = useRedirects({ type: 'organization', id: orga.id })
const defaultRedirect = computed(() => redirects.value?.[0])

const menu = ref(false)
const createForm = ref<InstanceType<typeof VForm>>()
const newPartner = () => ({ name: '', contactEmail: '', redirect: defaultRedirect.value?.value })
const editPartner = ref(newPartner())

watch(menu, () => {
  if (!menu.value) return
  editPartner.value = newPartner()
  createForm.value?.reset()
})

const confirmCreate = withUiNotif(async () => {
  await createForm.value?.validate()
  if (createForm.value?.isValid) {
    menu.value = false
    await $fetch(`organizations/${orga.id}/partners`, { method: 'POST', body: editPartner.value })
    sendUiNotif({ type: 'success', msg: t('pages.organization.invitePartnerSuccess', { email: editPartner.value.contactEmail }) })
    emit('change')
  }
})
</script>

<style lang="css" scoped>
</style>
