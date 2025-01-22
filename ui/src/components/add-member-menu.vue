<template>
  <v-menu
    v-if="isAdminOrga && members && members.results"
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.addMember')"
        size="small"
        color="primary"
        class="mx-2"
        :icon="mdiPlus"
        v-bind="props"
      />
    </template>
    <v-card
      v-if="orga && menu"
      data-iframe-height
      width="500px"
      :loading="!invitation"
    >
      <v-card-title
        v-if="!link"
        class="text-h6"
      >
        {{ $t('pages.organization.addMember') }}
      </v-card-title>
      <v-card-text v-if="disableInvite">
        <v-alert
          :value="true"
          type="warning"
        >
          {{ $t('pages.organization.disableInvite') }}
        </v-alert>
      </v-card-text>
      <v-card-text v-else-if="invitation">
        <v-form
          v-if="!link"
          ref="inviteForm"
          v-model="validInvitation"
          @submit.prevent
        >
          <v-text-field
            id="id"
            v-model="invitation.email"
            :label="$t('pages.organization.inviteEmail')"
            :rules="[v => !!v || '']"
            name="email"
            required
            variant="outlined"
            density="compact"
            autocomplete="off"
          />
          <v-select
            v-model="invitation.role"
            :items="orga.roles"
            :label="$t('common.role')"
            :rules="[v => !!v || '']"
            name="role"
            variant="outlined"
            density="compact"
          />
          <v-autocomplete
            v-if="$uiConfig.manageDepartments && orga.departments && orga.departments.length && !department"
            v-model="invitation.department"
            :items="orga.departments"
            :label="orga.departmentLabel || $t('common.department')"
            item-value="id"
            item-title="name"
            name="department"
            clearable
            variant="outlined"
            density="compact"
          />
          <v-select
            v-if="$uiConfig.manageSites && redirects && redirects.filter(r => r.value !== defaultRedirect?.value).length"
            v-model="invitation.redirect"
            :disabled="mainPublicUrl.host !== host"
            label="Site de redirection"
            :items="redirects"
            item-value="value"
            item-title="title"
            name="host"
            required
            density="compact"
            variant="outlined"
          />
        </v-form>
        <v-alert
          v-if="!!link"
          type="warning"
          variant="outlined"
        >
          <p>{{ $t('pages.organization.inviteLink') }}</p>
          <p style="word-break: break-all;">
            {{ link }}
          </p>
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="!link"
          variant="text"
          @click="menu=false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          :disabled="disableInvite || !invitation || !invitation.email || !invitation.role"
          color="primary"
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
import type { VForm } from 'vuetify/components'
import type { Organization, Member, Invitation } from '@sd/api/types'

const { host, mainPublicUrl, redirects, sitesFetch } = useStore()
const { sendUiNotif } = useUiNotif()
const i18n = useI18n()

const { orga, department } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  isAdminOrga: { type: Boolean, default: false },
  members: { type: Object as () => (null | ({ results: Member[] })), default: null },
  disableInvite: { type: Boolean, default: false },
  department: { type: String, default: null }
})
const emit = defineEmits({
  sent: (_invit: Invitation) => true
})

const defaultRedirect = computed(() => {
  if (host === mainPublicUrl.host) {
    return redirects.value?.[0]
  } else {
    return redirects.value?.find(r => r.value && new URL(r.value).host === host)
  }
})

const inviteForm = ref<InstanceType<typeof VForm>>()
const createInvitation = () => ({
  id: orga.id,
  name: orga.name,
  email: '',
  role: null,
  department,
  redirect: defaultRedirect.value?.value
})
const invitation = ref<ReturnType<typeof createInvitation>>()
const validInvitation = ref(false)
const link = ref('')

const menu = ref(false)
watch(menu, async () => {
  if (!menu) return
  if ($uiConfig.manageSites) await sitesFetch.refresh()
  invitation.value = createInvitation()
  link.value = ''
  inviteForm.value?.reset()
})

const confirmInvitation = withUiNotif(async () => {
  if (link.value) {
    menu.value = false
    return
  }
  await inviteForm.value?.validate()
  if (inviteForm.value?.isValid) {
    const validInvitation = invitation.value as unknown as Invitation
    const res = await $fetch('invitations/', { body: validInvitation, method: 'POST' })
    if (res && res.link) {
      link.value = res.link
    } else {
      menu.value = false
    }
    emit('sent', validInvitation)
    if (!$uiConfig.alwaysAcceptInvitation) {
      sendUiNotif({ type: 'success', msg: i18n.t('pages.organization.inviteSuccess', { email: validInvitation.email }) })
    }
  }
})

</script>

<style lang="css" scoped>
</style>
