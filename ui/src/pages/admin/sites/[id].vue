<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-skeleton-loader
      v-if="!sites.data.value || !site.data.value"
      type="article"
    />
    <v-form
      v-else
      v-model="valid"
      @submit.prevent
    >
      <v-defaults-provider :defaults="{VjsfTabs: {VWindowsItem: {eager: true}}}">
        <vjsf
          v-model="patch"
          :options="vjsfOptions"
          :schema="resolvedSchema"
        >
          <template #colors-preview="context">
            <colors-preview
              :colors-key="context.colorsKey"
              :colors="context.node.data[context.colorsKey]"
              :dark="context.dark"
            />
          </template>
        </vjsf>
      </v-defaults-provider>
    </v-form>
    <v-row class="ma-0 mt-4">
      <v-spacer />
      <v-btn
        color="primary"
        variant="flat"
        :disabled="patchSite.loading.value || site.loading.value || sites.loading.value"
        :loading="patchSite.loading.value || site.loading.value"
        @click="confirmEdit"
      >
        {{ $t('common.save') }}
      </v-btn>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'
import Vjsf from '@koumoul/vjsf'
import resolvedSchema from '../../../../../api/doc/sites/patch-req-body/.type/resolved-schema.json'

const patch = ref()
const valid = ref(false)
const form = ref<InstanceType<typeof VForm>>()

const vjsfOptions = computed(() => ({
  density: 'comfortable',
  context: {
    otherSites: sites.data.value?.results.filter(s => s._id !== siteId).map(site => site.host),
    otherSitesProviders: sites.data.value?.results.reduce((a, site) => { a[site.host] = (site.authProviders || []).filter(p => p.type === 'oidc').map(p => `${p.type}:${p.id}`); return a }, {} as Record<string, string[]>)
  }
}))

type SiteWithColorWarnings = Site & { colorWarnings: string[] }

const siteId = useRoute<'/admin/sites/[id]'>().params.id
const sites = useFetch<{ count: number, results: SiteWithColorWarnings[] }>($apiPath + '/sites', { query: { showAll: true } })
const site = useFetch<SiteWithColorWarnings>($apiPath + '/sites/' + siteId, { query: { showAll: true } })

const { patchSite } = useStore()

watch(site.data, () => {
  if (!site.data.value) return
  const siteClone = JSON.parse(JSON.stringify(site.data.value))
  delete siteClone._id
  delete siteClone.colorWarnings
  delete siteClone.owner
  delete siteClone.host
  delete siteClone.path
  patch.value = siteClone
})

const confirmEdit = async () => {
  await form.value?.validate()
  if (!valid.value) return
  await patchSite.execute(siteId, patch.value)
  site.refresh()
}

</script>

<style lang="css">
</style>
