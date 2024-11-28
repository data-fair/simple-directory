<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h6 mb-3">
        {{ $t('common.sites') }} <span v-if="sites.data.value">({{ $n(sites.data.value.count) }})</span>
        <site-post @created="sites.refresh()" />
      </h2>
    </v-row>

    <v-data-table
      v-if="sites"
      :headers="headers"
      :items="sites.data.value?.results"
      :loading="sites.loading.value"
      class="elevation-1"
      item-key="id"
      hide-default-footer
      :items-per-page="10000"
    >
      <template #item="props">
        <tr>
          <td v-if="props.item.logo">
            <img
              style="max-height: 100%"
              :src="props.item.logo"
            >
          </td>
          <td
            v-else
            :style="`min-width:50px;background-color:${props.item.theme.primaryColor}`"
          />
          <td>
            <a
              :href="`http://${props.item.host}`"
              target="blank"
            >{{ props.item.host }}</a>
          </td>
          <td>{{ props.item._id }}</td>
          <td>{{ props.item.owner.name }}</td>
          <td>{{ props.item.authMode }}</td>
          <td>
            <v-btn
              v-for="authProvider of (props.item.authProviders || [])"
              :key="authProvider.type + ':' + authProvider.id"
              :color="authProvider.color as string"
              size="small"
              rounded
              variant="flat"
              class="pl-0 pr-3 mr-2 mb-1 text-none text-white"
              style="cursor:default"
            >
              <v-avatar
                size="27"
                color="white"
                class="elevation-4"
                style="left:-1px; top: -1px;"
              >
                <v-icon
                  v-if="authProvider.icon"
                  :color="authProvider.color as string"
                >
                  {{ authProvider.icon }}
                </v-icon>
                <img
                  v-else-if="authProvider.img"
                  :src="authProvider.img as string"
                  :alt="authProvider.title as string"
                >
              </v-avatar>
              &nbsp;{{ authProvider.title }}
            </v-btn>
          </td>
          <td>
            <site-patch
              :site="props.item"
              :sites="sites.data.value?.results"
              @change="sites.refresh()"
            />
            <confirm-menu
              yes-color="warning"
              @confirm="deleteSite(props.item)"
            >
              <template #activator="{props}">
                <v-btn
                  :title="$t('common.delete')"
                  v-bind="props"
                  variant="text"
                  icon
                  color="warning"
                >
                  <v-icon :icon="mdiDelete" />
                </v-btn>
              </template>
            </confirm-menu>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup lang="ts">

const { t } = useI18n()
const sites = useFetch<{ count: number, results: Site[] }>($apiPath + '/sites', { query: { showAll: true } })

const deleteSite = withUiNotif(async (site: Site) => {
  await $fetch(`sites/${site._id}`, { method: 'DELETE' })
  sites.refresh()
})

const headers: { title: string, value?: string, sortable?: boolean }[] = [
  { title: '', value: 'theme.primaryColor', sortable: false },
  { title: t('common.host'), value: 'host' },
  { title: t('common.id'), value: '_id', sortable: false },
  { title: t('common.organization'), value: 'owner', sortable: false },
  { title: t('common.authMode'), value: 'authMode', sortable: false },
  { title: t('common.authProviders'), value: 'authProviders', sortable: false },
  { title: '', sortable: false }
]

</script>

<style lang="css">
</style>
