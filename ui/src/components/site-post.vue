<template>
  <v-dialog
    v-model="menu"
    fullscreen
    :close-on-content-click="false"
  >
    <template #activator="{props}">
      <v-fab
        :title="$t('pages.admin.sites.createSite')"
        size="small"
        color="primary"
        :icon="mdiPlus"
        v-bind="props"
      />
    </template>

    <v-card
      v-if="site"
      data-iframe-height
      width="500"
    >
      <v-card-title class="text-h6">
        {{ $t('pages.admin.sites.createSite') }}
      </v-card-title>
      <v-card-text v-if="menu">
        <v-form
          v-model="valid"
          @submit.prevent
        >
          {{ site }}
          <v-select
            :label="$t('common.owner')"
            :items="orgs"
            item-value="id"
            item-title="name"
            return-object
            :rules="[value => !!value]"
            @update:model-value="org => {site.owner = {type: 'organization', ...org}}"
          />
          <v-jsf
            v-model="site"
            :schema="schema"
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
          @click="confirmPost"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import resolvedSchema from '../../types/site-post/.type/resolved-schema.json'
import { mapActions, mapState } from 'vuex'

export default {
  data: () => ({ menu: false, site: null, valid: false, orgs: null }),
  computed: {
    ...mapState(['env']),
    schema () {
      const schema = JSON.parse(JSON.stringify(resolvedSchema))
      return schema
    },
    vjsfOptions () {
      return {
        evalMethod: 'newFunction'
      }
    }
  },
  watch: {
    menu () {
      if (this.menu) this.site = {}
      else this.site = null
    }
  },
  async mounted () {
    this.orgs = (await this.$axios('api/organizations?size=10000')).data.results
  },
  methods: {
    ...mapActions(['postSite']),
    async confirmPost (department) {
      this.menu = false
      await this.postSite(this.site)
      this.$emit('created')
    }
  }
}
</script>

<style lang="css" scoped>
</style>
