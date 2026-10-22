<template>
  <confirm-menu
    :title="$t('common.confirmDeleteTitle', {name: partner.name})"
    yes-color="warning"
    @confirm="confirmDelete.execute()"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.deletePartner')"
        :aria-label="$t('pages.organization.deletePartner')"
        variant="text"
        icon
        color="warning"
        v-bind="props"
      >
        <v-icon :icon="mdiDelete" />
      </v-btn>
    </template>
    <p>{{ $t('common.confirmDeleteMsg', {name: partner.name}) }}</p>
    <p>{{ $t('pages.organization.deletePartnerWarning') }}</p>
  </confirm-menu>
</template>

<script setup lang="ts">
const { orga, partner } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  partner: { type: Object as () => Partner, required: true }
})
const emit = defineEmits(['change'])

const confirmDelete = useAsyncAction(async () => {
  await $fetch(`organizations/${orga.id}/partners/${partner.partnerId}`, { method: 'DELETE' })
  emit('change')
})
</script>

<style lang="css" scoped>
</style>
