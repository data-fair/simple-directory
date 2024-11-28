<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        icon
        color="warning"
        size="small"
        :title="$t('pages.organization.sendInvitationLink')"

        v-bind="props"
      >
        <v-icon :icon="mdiSend" />
      </v-btn>
    </template>
    <v-card
      v-if="menu"
      data-iframe-height
      width="500px"
    >
      <v-card-title>
        {{ $t('pages.organization.sendInvitationLink') }}
      </v-card-title>
      <v-card-text>
        <v-text-field
          v-model="editPartner.name"
          :label="$t('common.orgName')"
          :rules="[v => !!v || '']"
          name="name"
          required
          density="compact"
          variant="outlined"
          disabled
        />
        <v-text-field
          v-model="editPartner.contactEmail"
          :label="$t('common.contactEmail')"
          :rules="[v => !!v || '']"
          name="contactEmail"
          required
          density="compact"
          variant="outlined"
          disabled
        />
        <v-select
          v-if="$uiConfig.manageSites"
          v-model="redirect"
          label="Site de redirection"
          :items="redirects"
          :loading="!redirects"
          name="host"
          required
          density="compact"
          variant="outlined"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="menu=false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          color="warning"
          variant="flat"
          @click="confirmInvitation()"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
const { orga, partner } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  partner: { type: Object as () => Partner, required: true }
})
const emit = defineEmits(['change'])

const { redirects } = useStore()
const redirect = useStringSearchParam('redirect')
const { sendUiNotif } = useUiNotif()
const { t } = useI18n()

const menu = ref(false)
const editPartner = ref({ ...partner })

const confirmInvitation = withUiNotif(async () => {
  menu.value = false
  await $fetch(`organizations/${orga.id}/partners`, { method: 'POST', body: { name: editPartner.value.name, contactEmail: editPartner.value.contactEmail, redirect: redirect.value } })
  sendUiNotif({ type: 'success', msg: t('pages.organization.invitePartnerSuccess', { email: partner.contactEmail }) })
  emit('change')
})
</script>

<style>

</style>
