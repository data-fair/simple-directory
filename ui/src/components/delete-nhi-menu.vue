<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
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

    <v-card
      data-iframe-height
      width="500"
    >
      <v-card-title>
        {{ $t('pages.organization.confirmDeleteNhiTitle', {name: nhi.name}) }}
      </v-card-title>
      <v-card-text>
        <p>
          {{ $t('pages.organization.confirmDeleteNhiMsg') }}
        </p>
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
          @click="confirmDelete.execute()"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
const { orga, nhi } = defineProps({
  orga: { type: Object as () => Organization, required: true },
  nhi: { type: Object as () => any, required: true }
})
const emit = defineEmits(['change'])

const menu = ref(false)

const confirmDelete = useAsyncAction(async () => {
  menu.value = false
  await $fetch(`organizations/${orga.id}/nhis/${nhi.id}`, { method: 'DELETE' })
  emit('change')
})
</script>

<style lang="css" scoped>
</style>
