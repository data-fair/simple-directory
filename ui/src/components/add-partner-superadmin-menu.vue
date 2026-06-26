<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-fab
        :title="$t('pages.organization.addPartner')"
        size="small"
        color="admin"
        class="mx-2"
        :icon="mdiPlus"
        v-bind="props"
      />
    </template>

    <v-card
      data-iframe-height
      :width="500"
    >
      <v-card-title>
        {{ $t('pages.organization.addPartner') }}
      </v-card-title>
      <v-card-text>
        <v-form
          ref="createForm"
          @submit.prevent
        >
          <v-autocomplete
            v-model="selectedOrg"
            :label="$t('common.organization')"
            :items="orgItems"
            :loading="search.loading.value"
            item-title="name"
            item-value="id"
            return-object
            no-filter
            :rules="[v => !!v || '']"
            name="partnerOrg"
            required
            density="compact"
            variant="outlined"
            autocomplete="off"
            @update:search="onSearch"
          />
        </v-form>
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
          color="primary"
          variant="flat"
          @click="confirmCreate.execute()"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const { sendUiNotif } = useUiNotif()
const { t } = useI18n()

const { orga } = defineProps({
  orga: { type: Object as () => Organization, required: true }
})
const emit = defineEmits(['change'])

const menu = ref(false)
const createForm = ref<InstanceType<typeof VForm>>()
const selectedOrg = ref<{ id: string, name: string } | null>(null)
const orgItems = ref<{ id: string, name: string }[]>([])

watch(menu, () => {
  if (!menu.value) return
  selectedOrg.value = null
  orgItems.value = []
  createForm.value?.reset()
})

const search = useAsyncAction(async (q: string) => {
  const res = await $fetch('organizations', { params: { q } }) as { results: { id: string, name: string }[] }
  orgItems.value = res.results
})
const onSearch = (q: string) => {
  if (!q || (selectedOrg.value && q === selectedOrg.value.name)) return
  search.execute(q)
}

const confirmCreate = useAsyncAction(async () => {
  await createForm.value?.validate()
  if (createForm.value?.isValid && selectedOrg.value) {
    menu.value = false
    await $fetch(`organizations/${orga.id}/partners/_create`, {
      method: 'POST',
      body: { id: selectedOrg.value.id }
    })
    sendUiNotif({ type: 'success', msg: t('common.modificationOk') })
    emit('change')
  }
})
</script>

<style lang="css" scoped>
</style>
