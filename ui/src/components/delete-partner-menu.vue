<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.deletePartner')"
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
        {{ $t('common.confirmDeleteTitle', {name: partner.name}) }}
      </v-card-title>
      <v-card-text>
        <p>
          {{ $t('common.confirmDeleteMsg', {name: partner.name}) }}
        </p>
        <p>
          Attention les permissions accordées à l'organisation partenaire ne seront pas modifiées par cette opération. Vous devriez probablement aller les modifier vous même.
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
          @click="confirmDelete"
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

const menu = ref(false)

const confirmDelete = withUiNotif(async () => {
  menu.value = false
  await $fetch(`organizations/${orga.id}/partners/${partner.partnerId}`, { method: 'DELETE' })
  emit('change')
})
</script>

<style lang="css" scoped>
</style>
