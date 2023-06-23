<template>
  <v-dialog
    v-model="menu"
    fullscreen
    :close-on-content-click="false"
    offset-y
  >
    <template #activator="{on}">
      <v-btn
        :title="$t('common.editTitle', {name: site.host})"
        text
        icon
        v-on="on"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </template>

    <v-card
      v-if="patch"
      data-iframe-height
      width="500"
    >
      <v-card-title class="text-h6">
        {{ $t('common.editTitle', {name: site.host}) }}
      </v-card-title>
      <v-card-text v-if="menu">
        {{ vjsfOptions }}
        <v-form v-model="valid">
          <v-jsf
            v-model="patch"
            :schema="schema"
            :options="vjsfOptions"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
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

<script>
import { resolvedSchema } from '../../types/site-patch'
import { mapActions, mapState } from 'vuex'

export default {
  props: ['site', 'sites'],
  data: () => ({ menu: false, patch: null, valid: false, model: {} }),
  computed: {
    ...mapState(['env']),
    schema () {
      const schema = JSON.parse(JSON.stringify(resolvedSchema))
      schema.properties.authProviders.items.oneOf[0].properties.discovery['x-slots'] = {
        before: `Donnez cette [URL de retour de connexion](https://${this.site.host}/simple-directory/api/auth/oauth-callback) au fournisseur d'identité et définissez les scopes "openid", "profile", "email".`
      }
      /* uncomment if we activate saml support someday
      schema.properties.authProviders.items.oneOf[1].properties.metadata['x-slots'] = {
        before: `Remplissez le champ ci-dessous avec les métadonnées au format XML données par le fournisseurs d'identité. Et donnez ce [lien en retour](http://${this.site.host}/simple-directory/api/auth/saml2-metadata.xml).`
      } */
      return schema
    },
    vjsfOptions () {
      return {
        context: {
          otherSites: this.sites.filter(s => s._id !== this.site._id).map(site => site.host),
          otherSitesProviders: this.sites.reduce((a, site) => { a[site.host] = site.authProviders.filter(p => p.type === 'oidc').map(p => `${p.type}:${p.id}`); return a }, {})
        }
      }
    }
  },
  watch: {
    menu () {
      if (!this.menu) return
      this.patch = JSON.parse(JSON.stringify(this.site))
    }
  },
  methods: {
    ...mapActions(['patchSite']),
    async confirmEdit (department) {
      this.menu = false
      await this.patchSite(this.patch)
      this.$emit('change')
    }
  }
}
</script>

<style lang="css" scoped>
</style>
