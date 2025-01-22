<template>
  <v-dialog
    v-model="menu"
    fullscreen
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('common.editTitle', {name: site.host})"
        variant="text"
        icon
        v-bind="props"
      >
        <v-icon :icon="mdiPencil" />
      </v-btn>
    </template>

    <v-card
      v-if="patch"
      data-iframe-height
      width="500"
    >
      <v-card-title>
        {{ $t('common.editTitle', {name: site.host}) }}
      </v-card-title>
      <v-card-text v-if="menu">
        <v-form
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
                  :theme="context.node.data"
                  :dark="context.dark"
                />
              </template>
            </vjsf>
          </v-defaults-provider>
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
          :disabled="patchSite.loading.value"
          :loading="patchSite.loading.value"
          @click="confirmEdit"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'
import Vjsf from '@koumoul/vjsf'
import resolvedSchema from '../../../api/doc/sites/patch-req-body/.type/resolved-schema.json'

const { site, sites } = defineProps({
  site: { type: Object as () => Site, required: true },
  sites: { type: Array as () => Site[], required: true }
})
const emit = defineEmits(['change'])

const { patchSite } = useStore()

const menu = ref(false)
const patch = ref()
const valid = ref(false)

const form = ref<InstanceType<typeof VForm>>()

const vjsfOptions = computed(() => ({
  density: 'comfortable',
  context: {
    otherSites: sites.filter(s => s._id !== site._id).map(site => site.host),
    otherSitesProviders: sites.reduce((a, site) => { a[site.host] = (site.authProviders || []).filter(p => p.type === 'oidc').map(p => `${p.type}:${p.id}`); return a }, {} as Record<string, string[]>)
  }
}))

watch(menu, () => {
  if (!menu.value) return
  const siteClone = JSON.parse(JSON.stringify(site))
  delete siteClone._id
  patch.value = siteClone
})

const confirmEdit = async () => {
  await form.value?.validate()
  if (!valid.value) return
  menu.value = false
  await patchSite.execute(site._id, patch.value)
  emit('change')
}

/*
const schema = JSON.parse(JSON.stringify(resolvedSchema))
      schema.properties.authProviders.items.oneOf[0].properties.discovery['x-slots'] = {
        before: `Donnez cette [URL de retour de connexion](https://${this.site.host}/simple-directory/api/auth/oauth-callback) au fournisseur d'identité et définissez les scopes "openid", "profile", "email".`
      }
      uncomment if we activate saml support someday
      schema.properties.authProviders.items.oneOf[1].properties.metadata['x-slots'] = {
        before: `Remplissez le champ ci-dessous avec les métadonnées au format XML données par le fournisseurs d'identité. Et donnez ce [lien en retour](http://${this.site.host}/simple-directory/api/auth/saml2-metadata.xml).`
      } */

</script>

<style lang="css" scoped>
</style>
