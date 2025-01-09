<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="my-3 mx-0">
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
      item-key="id"
      class="border-sm"
      density="compact"
      hide-default-footer
      :items-per-page="10000"
    >
      <template #item="props">
        <tr>
          <td v-if="props.item.theme.logo">
            <img
              style="max-height: 100%"
              :src="props.item.theme.logo"
            >
          </td>
          <td
            v-else
            :style="`min-width:50px;background-color:${props.item.theme.colors.primary}`"
          />
          <td>
            <a
              :href="`http://${props.item.host}${props.item.path ?? ''}`"
              target="blank"
              class="text-primary"
            >{{ props.item.host }}</a>
          </td>
          <td>{{ props.item._id }}</td>
          <td>
            <router-link
              :to="`/organization/${props.item.owner.id}`"
              class="text-primary"
            >
              {{ props.item.owner.name }}
            </router-link>
          </td>
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
                size="28"
                :style="`left:-1px;top:-1px;background-color: ${$vuetify.theme.current.colors.surface};`"
                class="elevation-4"
              >
                <v-icon
                  v-if="authProvider.icon"
                  size="25"
                  :color="authProvider.color as string"
                >
                  {{ authProvider.icon }}
                </v-icon>
                <v-img
                  v-else-if="authProvider.img"
                  :src="authProvider.img as string"
                  :alt="authProvider.title as string"
                />
              </v-avatar>
              &nbsp;{{ authProvider.title }}
            </v-btn>
          </td>
          <td>
            <v-btn
              :title="$t('common.editTitle', {name: props.item.host})"
              variant="text"
              :to="`/admin/sites/${props.item._id}`"
              :icon="mdiPencil"
            />
            <confirm-menu
              yes-color="warning"
              @confirm="deleteSite(props.item)"
            >
              <template #activator="{props: activatorProps}">
                <v-btn
                  :title="$t('common.delete')"
                  v-bind="activatorProps"
                  variant="text"
                  icon
                  color="warning"
                >
                  <v-icon :icon="mdiDelete" />
                </v-btn>
              </template>
            </confirm-menu>
            <v-menu v-if="props.item.colorWarnings.length">
              <template #activator="{props: colorWarningsMenuProps}">
                <v-btn
                  :title="$t('pages.admin.sites.colorWarnings')"
                  color="warning"
                  class="mx-2"
                  variant="text"
                  :icon="mdiThemeLightDark"
                  v-bind="colorWarningsMenuProps"
                />
              </template>
              <v-list class="border-sm">
                <v-list-item
                  v-for="(warning, i) of props.item.colorWarnings"
                  :key="i"
                >
                  <v-list-item-title>
                    {{ warning }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup lang="ts">

type SiteWithColorWarnings = Site & { colorWarnings: string[] }

const { t } = useI18n()
const sites = useFetch<{ count: number, results: SiteWithColorWarnings[] }>($apiPath + '/sites', { query: { showAll: true } })

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
