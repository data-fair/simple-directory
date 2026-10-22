<template>
  <confirm-menu
    v-model="menu"
    :title="$t('pages.organization.confirmDeleteMemberTitle', {name: member.name})"
    :disabled="disabled || member.readOnly || isLastAdmin"
    yes-color="warning"
    @confirm="$emit('delete', member)"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.deleteMember')"
        :aria-label="$t('pages.organization.deleteMember')"
        variant="text"
        :icon="mdiDelete"
        density="compact"
        color="warning"
        v-bind="props"
      />
    </template>
    <v-alert
      v-if="member.readOnly"
      type="warning"
      border="start"
      variant="outlined"
      density="compact"
    >
      {{ $t('pages.organization.memberReadOnly') }}
    </v-alert>
    <template v-else>
      <p>{{ $t('pages.organization.confirmDeleteMemberMsg', {org: orga.name + (member.department ? (' / ' + (member.departmentName || member.department)) : '')}) }}</p>
      <v-alert
        v-if="isLastAdmin"
        type="error"
        variant="outlined"
        class="mt-4"
      >
        {{ $t(isLastMember ? 'pages.organization.deleteMemberLastMember' : 'pages.organization.deleteMemberLastAdmin') }}
      </v-alert>
      <v-alert
        v-else-if="isSelf"
        type="warning"
        variant="outlined"
        class="mt-4"
      >
        {{ $t('pages.organization.deleteMemberSelfWarning') }}
      </v-alert>
    </template>
  </confirm-menu>
</template>

<script setup lang="ts">
const { member, orga } = defineProps({
  member: { type: Object as () => Member, required: true },
  orga: { type: Object as () => Organization, required: true },
  // declared so it does not fall through onto confirm-menu and override its own disabled state
  disabled: { type: Boolean, default: false }
})
defineEmits({ delete: (_member: Member) => true })
const menu = ref(false)
const { isSelf, isLastAdmin, isLastMember } = useLastAdmin(() => orga, () => member, menu)
</script>

<style lang="css" scoped>
</style>
