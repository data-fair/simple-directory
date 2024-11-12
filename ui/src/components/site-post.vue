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
          <v-select
            :label="$t('common.owner')"
            :items="orgs.data.value?.results"
            item-value="id"
            item-title="name"
            return-object
            :rules="[value => !!value]"
            @update:model-value="org => {site.owner = {type: 'organization', ...org}}"
          />
          <vjsf-site-post-body
            v-model="site"
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

const emit = defineEmits(['created'])

const menu = ref(false)
const site = ref()
const valid = ref(false)

const { postSite } = useStore()

const orgs = useFetch<{ results: Organization[] }>($apiPath + 'api/organizations?size=10000')

const confirmPost = async () => {
  menu.value = false
  await postSite(site.value)
  emit('created')
}

</script>

<style lang="css" scoped>
</style>
