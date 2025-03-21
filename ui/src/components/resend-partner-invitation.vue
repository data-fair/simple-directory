<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :icon="mdiSend"
        color="warning"
        variant="text"
        size="small"
        :title="$t('pages.organization.sendInvitationLink')"
        v-bind="props"
      />
    </template>
    <v-card
      v-if="menu"
      data-iframe-height
      width="500px"
      :loading="!editPartner || loadingRedirects"
    >
      <v-card-title>
        {{ $t('pages.organization.sendInvitationLink') }}
      </v-card-title>
      <template v-if="editPartner && !loadingRedirects">
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
            v-if="$uiConfig.manageSites && redirects && redirects.length > 1"
            v-model="editPartner.redirect"
            label="Site de redirection"
            :items="redirects"
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
      </template>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
const { orga, partner } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  partner: { type: Object as () => Partner, required: true }
})
const emit = defineEmits(['change'])

const { redirects, loadingRedirects } = useRedirects({ type: 'organization', id: orga.id })
const { sendUiNotif } = useUiNotif()
const { t } = useI18n()

const menu = ref(false)
const editPartner = ref({ ...partner, redirect: redirects.value?.[0]?.value })

const confirmInvitation = withUiNotif(async () => {
  menu.value = false
  await $fetch(`organizations/${orga.id}/partners`, { method: 'POST', body: { name: editPartner.value.name, contactEmail: editPartner.value.contactEmail, redirect: editPartner.value.redirect } })
  sendUiNotif({ type: 'success', msg: t('pages.organization.invitePartnerSuccess', { email: partner.contactEmail }) })
  emit('change')
})
</script>

<style>

</style>
