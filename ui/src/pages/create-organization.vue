<template lang="html">
  <v-container data-iframe-height>
    <h2 class="text-h5 mb-3">
      {{ $t('common.createOrganization') }}
    </h2>
    <v-form
      ref="form"
      v-model="valid"
      lazy-validation
      @submit.prevent
    >
      <v-text-field
        v-model="newOrga.name"
        :label="$t('common.name')"
        :rules="[v => !!v || '']"
        name="name"
        required
      />
      <v-textarea
        v-model="newOrga.description"
        :label="$t('common.description')"
        name="description"
        outlines
      />
      <v-checkbox
        v-if="user && user.adminMode"
        v-model="autoAdmin"
        :label="$t('common.autoAdmin')"
        name="member"
      />
      <v-row>
        <v-spacer />
        <v-btn
          :disabled="!valid"
          color="primary"
          @click="create"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-row>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const { user, keepalive } = useSession()
const router = useRouter()

const newOrga = ref({ name: '', description: '' })

const valid = ref(false)
const autoAdmin = ref(true)

const form = ref<InstanceType<typeof VForm>>()
const create = withUiNotif(async () => {
  const createdOrga = await $fetch<Organization>('organizations', { method: 'POST', body: newOrga.value, params: { autoAdmin: autoAdmin.value } })
  await keepalive()
  router.push(`/organizations/${createdOrga.id}`)
})
</script>

<style lang="css">
</style>
