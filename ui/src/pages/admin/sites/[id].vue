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
      ref="form"
      v-model="valid"
      @submit.prevent
    >
      <h1 class="text-h3 mb-3">
        {{ $t('pages.admin.site.title') }}
      </h1>
      <a
        :href="siteHref"
        class="simple-link"
      >{{ siteHref }}</a> - {{ site.data.value?._id }}
      <vjsf-patch-req-body
        v-model="patch"
        :locale="locale"
        :options="vjsfOptions"
      >
        <template #colors-preview="context">
          <colors-preview
            :colors-key="context.colorsKey"
            :theme="context.node.data"
            :dark="context.dark"
          />
        </template>
        <template #oidc-help>
          Donnez cette URL de retour de connexion ({{ siteHref + '/simple-directory/api/auth/oauth-callback' }}) au fournisseur d'identité et définissez les scopes "openid", "profile", "email".
        </template>
        <template #saml-help>
          Remplissez le champ ci-dessous avec les métadonnées au format XML données par le fournisseurs d'identité. Et donnez ce <a :href="siteHref + '/simple-directory/api/auth/saml2-metadata.xml'">lien en retour</a>.
        </template>
      </vjsf-patch-req-body>
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

const patch = ref()
const valid = ref(false)
const form = ref<InstanceType<typeof VForm>>()

const { locale } = useI18n()

const vjsfOptions = computed(() => {
  const owner = site.data.value?.owner
  const otherSites = sites.data.value?.results
    .filter(s => s.owner.type === owner?.type && s.owner.id === owner?.id && s._id !== siteId)
  return {
    density: 'comfortable',
    initialValidation: 'always',
    context: {
      hasAccountMainSite: otherSites?.some(s => s.isAccountMain),
      otherSites: otherSites?.map(site => site.host),
      otherSitesProviders: otherSites?.reduce((a, site) => { a[site.host] = (site.authProviders || []).filter(p => p.type === 'oidc').map(p => `${p.type}:${p.id}`); return a }, {} as Record<string, string[]>)
    }
  }
})

type SiteWithColorWarnings = Site & { colorWarnings: string[] }

const siteId = useRoute<'/admin/sites/[id]'>().params.id
const sites = useFetch<{ count: number, results: SiteWithColorWarnings[] }>($apiPath + '/sites', { query: { showAll: true } })
const site = useFetch<SiteWithColorWarnings>($apiPath + '/sites/' + siteId, { query: { showAll: true } })

const siteHref = computed(() => `${site.data.value?.host.startsWith('localhost:') ? 'http' : 'https'}://${site.data.value?.host}${site.data.value?.path ?? ''}`)

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
