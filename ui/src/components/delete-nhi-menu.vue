<template>
  <confirm-menu
    :title="$t('pages.organization.confirmDeleteNhiTitle', {name: nhi.name})"
    yes-color="warning"
    @confirm="confirmDelete.execute()"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.deleteNhi')"
        variant="text"
        icon
        color="warning"
        v-bind="props"
      >
        <v-icon :icon="mdiDelete" />
      </v-btn>
    </template>
    <p>{{ $t('pages.organization.confirmDeleteNhiMsg') }}</p>
  </confirm-menu>
</template>

<script setup lang="ts">
const { orga, nhi } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  nhi: { type: Object as () => any, required: true }
})
const emit = defineEmits(['change'])

const confirmDelete = useAsyncAction(async () => {
  await $fetch(`organizations/${orga.id}/nhis/${nhi.id}`, { method: 'DELETE' })
  emit('change')
})
</script>

<style lang="css" scoped>
</style>
