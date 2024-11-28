<template>
  <v-dialog
    v-model="menu"
    fullscreen
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.admin.sites.createSite')"
        size="small"
        color="primary"
        :icon="mdiPlus"
        class="mx-2"
        v-bind="props"
      />
    </template>

    <v-card
      v-if="site"
      data-iframe-height
      width="500"
    >
      <v-card-title>
        {{ $t('pages.admin.sites.createSite') }}
      </v-card-title>
      <v-card-text v-if="menu">
        <v-form
          v-model="valid"
          @submit.prevent
        >
          <vjsf
            v-model="site"
            :schema="resolvedSchema"
            :options="{density: 'comfortable', context: {sdUrl: $sdUrl}}"
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
          :disabled="!valid"
          @click="confirmPost"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import Vjsf from '@koumoul/vjsf'
import { resolvedSchema } from '../../../api/doc/sites/post-req-body/index.ts'

const emit = defineEmits(['created'])

const menu = ref(false)
const site = ref<any>({})
const org = ref<any>(null)
const valid = ref(false)

const { postSite } = useStore()

const confirmPost = async () => {
  menu.value = false
  await postSite({ ...site.value, owner: { type: 'organization', ...org.value } })
  emit('created')
}

</script>

<style lang="css" scoped>
</style>
