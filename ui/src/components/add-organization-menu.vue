<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        v-if="mode === 'icon'"
        :title="$t('common.createOrganization')"
        color="primary"
        v-bind="props"
        :icon="mdiPlus"
        size="small"
        class="mb-2 mx-2"
      />
      <v-btn
        v-else
        :title="$t('common.createOrganization')"
        color="primary"
        variant="text"
        v-bind="props"
        class="mt-3"
      >
        {{ $t('common.createOrganization') }}
      </v-btn>
    </template>

    <v-card
      v-if="editOrganization"
      :width="500"
      data-iframe-height
    >
      <v-card-title>
        {{ $t('common.createOrganization') }}
      </v-card-title>
      <v-card-text>
        <v-form
          ref="createForm"
          @submit.prevent
        >
          <v-text-field
            v-model="editOrganization.name"
            :label="$t('common.name')"
            :rules="[v => !!v || '', v => v.length < 150 || $t('common.tooLong')]"
            name="name"
            required
            variant="outlined"
            density="compact"
            autocomplete="off"
          />
          <v-textarea
            v-model="editOrganization.description"
            :label="$t('common.description')"
            name="description"
            variant="outlined"
            autocomplete="off"
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
          @click="confirmCreate"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const { autoAdmin, mode } = defineProps({
  autoAdmin: { type: Boolean, default: true },
  mode: { type: String, default: 'link' },
})

const { switchOrganization } = useSession()

const menu = ref(false)
const newOrganization = { name: '', description: '' }

const createForm = ref<InstanceType<typeof VForm>>()
const editOrganization = ref({ ...newOrganization })

watch(menu, () => {
  if (!menu.value) return
  editOrganization.value = { ...newOrganization }
  createForm.value?.reset()
})

const confirmCreate = withUiNotif(async () => {
  await createForm.value?.validate()
  if (createForm.value?.isValid) {
    menu.value = false
    const res = await $fetch('organizations', { method: 'POST', body: editOrganization.value, params: { autoAdmin } })
    switchOrganization(res.id)
    // reloading top page, so that limits are re-fetched, etc.
    window.top?.location.reload()
  }
})
</script>

<style lang="css" scoped>
</style>
