<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.deleteMember')"
        variant="text"
        :icon="mdiDelete"
        density="compact"
        color="warning"
        v-bind="props"
      />
    </template>
    <v-card
      data-iframe-height
      width="500"
    >
      <v-card-title>
        {{ $t('pages.organization.confirmDeleteMemberTitle', {name: member.name}) }}
      </v-card-title>
      <v-card-text>
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
          {{ $t('pages.organization.confirmDeleteMemberMsg', {org: orga.name + (member.department ? (' / ' + (member.departmentName || member.department)) : '')}) }}
        </template>
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
          color="warning"
          variant="flat"
          :disabled="member.readOnly"
          @click="menu = false;$emit('delete', member)"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
const { member, orga } = defineProps({
  member: { type: Object as () => Member, required: true },
  orga: { type: Object as () => Organization, required: true }
})
defineEmits({ delete: (_member: Member) => true })
const menu = ref(false)
</script>

<style lang="css" scoped>
</style>
