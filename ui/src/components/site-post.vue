<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    persistent
    width="500"
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
    >
      <v-card-title>
        {{ $t('pages.admin.sites.createSite') }}
      </v-card-title>
      <v-card-text v-if="menu">
        <v-form
          ref="form"
          v-model="valid"
        >
          <vjsf
            v-model="site"
            :schema="resolvedSchema"
            :options="vjsfOptions"
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
          :disabled="postSite.loading.value"
          :loading="postSite.loading.value"
          @click="confirmPost"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import Vjsf from '@koumoul/vjsf'
import resolvedSchema from '../../../api/doc/sites/post-req-body/.type/resolved-schema.json'
import type { VForm } from 'vuetify/components'
const emit = defineEmits(['created'])

const menu = ref(false)
const site = ref<any>({})
const valid = ref(false)

const form = ref<InstanceType<typeof VForm>>()
const vjsfOptions = { density: 'comfortable', context: { sdUrl: $sdUrl } }

const { postSite } = useStore()

const confirmPost = async () => {
  await form.value?.validate()
  if (!valid.value) return
  await postSite.execute(site.value)
  menu.value = false
  emit('created')
}

</script>

<style lang="css" scoped>
</style>
