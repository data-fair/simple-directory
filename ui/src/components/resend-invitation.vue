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
        <v-icon>mdi-send</v-icon>
      </v-btn>
    </template>
    <v-card
      v-if="menu"
      data-iframe-height
      width="500px"
    >
      <v-card-title
        v-if="!link"
        class="text-h6"
      >
        {{ $t('pages.organization.sendInvitationLink') }}
      </v-card-title>
      <v-card-text>
        <template v-if="!link">
          <v-text-field
            v-model="invitation.email"
            :label="$t('pages.organization.inviteEmail')"
            name="email"
            disabled
            variant="outlined"
            density="compact"
          />
          <v-select
            v-model="invitation.role"
            :items="orga.roles"
            :label="$t('common.role')"
            disabled
            variant="outlined"
            density="compact"
          />
          <v-select
            v-if="invitation.department"
            v-model="invitation.department"
            :items="orga.departments"
            :label="orga.departmentLabel || $t('common.department')"
            item-value="id"
            item-title="name"
            disabled
            variant="outlined"
            density="compact"
          />
        </template>
        <v-alert
          :value="!!link"
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
          :disabled="!invitation.email || !invitation.role"
          color="warning"
          @click="confirmInvitation()"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
const { orga, member } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  member: { type: Object as () => Member, required: true }
})
const emit = defineEmits({ sent: (_invit: Invitation) => true })

const { sendUiNotif } = useUiNotif()
const { t } = useI18n()

const menu = ref(false)
const link = ref<string | null>(null)
const newInvitation = () => {
  const invit: Invitation = {
    id: orga.id,
    name: orga.name,
    email: member.email,
    role: member.role,
    redirect: reactiveSearchParams.redirect
  }
  if (member.department) invit.department = member.department
  return invit
}
const invitation = ref(newInvitation())
const reactiveSearchParams = useReactiveSearchParams()

watch(menu, () => {
  if (!menu.value) return
  invitation.value = newInvitation()
  link.value = null
})

const confirmInvitation = withUiNotif(async () => {
  if (link.value) {
    menu.value = false
    return
  }
  if (!invitation.value) return
  const res = await $fetch('invitations', { method: 'POST', body: invitation.value, params: { force_mail: true } })
  if (res && res.link) {
    link.value = res.link
  } else {
    menu.value = false
  }
  emit('sent', invitation.value)
  sendUiNotif({ type: 'success', msg: t('pages.organization.inviteSuccess', { email: invitation.value.email }) })
})
</script>

<style>

</style>
