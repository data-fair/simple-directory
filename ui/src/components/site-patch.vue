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
          <vjsf-site-patch-body
            v-model="patch"
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
          :disabled="!valid"
          @click="confirmEdit"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const { site, sites } = defineProps({
  site: { type: Object as () => Site, required: true },
  sites: { type: Array as () => Site[], required: true }
})
const emit = defineEmits(['change'])

const { patchSite } = useStore()

const menu = ref(false)
const patch = ref()
const valid = ref(false)

const vjsfOptions = computed(() => ({
  context: {
    otherSites: sites.filter(s => s._id !== site._id).map(site => site.host),
    otherSitesProviders: sites.reduce((a, site) => { a[site.host] = (site.authProviders || []).filter(p => p.type === 'oidc').map(p => `${p.type}:${p.id}`); return a }, {} as Record<string, string[]>)
  },
  evalMethod: 'newFunction'
}))

watch(menu, () => {
  if (!menu.value) return
  patch.value = JSON.parse(JSON.stringify(site))
})

const confirmEdit = async () => {
  menu.value = false
  await patchSite(patch.value)
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
