<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h6 mb-3">
        {{ $t('common.organizations') }} <span v-if="organizations.data.value">({{ $n(organizations.data.value.count) }})</span>
      </h2>
      <add-organization-menu
        :auto-admin="false"
        mode="icon"
      />
    </v-row>

    <v-row class="mb-3 mx-0">
      <v-text-field
        v-model="q"
        :label="$t('common.search')"
        name="search"
        variant="solo"
        density="comfortable"
        style="max-width:300px;"
        :append-inner-icon="mdiMagnify"
        clearable
        @click:clear="validQ = ''"
        @click:append-inner="validQ = q"
        @keyup.enter="validQ = q"
      />
    </v-row>

    <v-data-table-server
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="organizations.data.value?.results"
      :items-length="organizations.data.value?.count || 0"
      :loading="organizations.loading.value"
      class="border-sm"
      density="compact"
      item-key="id"
      :items-per-page-options="[10, 25, 100]"
      :multi-sort="false"
      :must-sort="true"
    >
      <template #item="props">
        <tr>
          <td v-if="$uiConfig.avatars.orgs">
            <v-avatar
              :size="36"
              class="ml-2"
              :image="$sdUrl + '/api/avatars/organization/' + props.item.id + '/avatar.png'"
            />
          </td>
          <td>{{ props.item.name }}</td>
          <td>{{ props.item.id }}</td>
          <td>{{ props.item.description }}</td>
          <template v-if="!$uiConfig.readonly">
            <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
            <td>{{ props.item.updated && $d(new Date(props.item.updated.date)) }}</td>
            <td>
              <div class="d-flex">
                <v-btn
                  :title="$t('common.editTitle', {name: props.item.name})"
                  :to="`/organization/${props.item.id}`"
                  :icon="mdiPencil"
                  variant="text"
                />
                <v-btn
                  :title="$t('common.delete')"
                  color="warning"
                  :icon="mdiDelete"
                  variant="text"
                  @click="currentOrganization = props.item;deleteOrganizationDialog = true"
                >
                  <v-icon />
                </v-btn>
              </div>
            </td>
          </template>
          <template v-else>
            <td>
              <div class="d-flex">
                <v-btn
                  :to="`/organization/${props.item.id}`"
                  :icon="mdiEye"
                  variant="text"
                />
              </div>
            </td>
          </template>
        </tr>
      </template>
    </v-data-table-server>

    <v-dialog
      v-model="deleteOrganizationDialog"
      max-width="500px"
    >
      <v-card v-if="currentOrganization">
        <v-card-title>
          {{ $t('common.confirmDeleteTitle', {name: currentOrganization.name}) }}
        </v-card-title>
        <v-card-text>
          {{ $t('common.confirmDeleteMsg') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="deleteOrganizationDialog = false"
          >
            {{ $t('common.confirmCancel') }}
          </v-btn>
          <v-btn
            color="warning"
            @click="deleteOrganizationDialog = false;deleteOrganization(currentOrganization)"
          >
            {{ $t('common.confirmOk') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { site: siteRef } = useSession()

const site = siteRef.value
if (!site) {
  throw new Error('No site')
}

const validQ = useStringSearchParam('q')
const q = ref(validQ.value)
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref<{ key: string, order: 'asc' | 'desc' }[]>([{ key: 'name', order: 'asc' }])
const sort = computed(() => {
  if (!sortBy.value.length) return ''
  return (sortBy.value[0].order === 'desc' ? '-' : '') + sortBy.value[0].key
})
const organizationsQuery = computed(() => ({ q: validQ.value, allFields: true, page: page.value, size: itemsPerPage.value, sort: sort.value, host: window.location.host, path: $sitePath || undefined }))
const organizations = useFetch<{ count: number, results: Organization[] }>($apiPath + '/organizations', { query: organizationsQuery })

const deleteOrganizationDialog = ref(false)
const currentOrganization = ref<Organization | null>(null)

const deleteOrganization = withUiNotif(async (org) => {
  await $fetch(`organizations/${org.id}`, { method: 'DELETE' })
  organizations.refresh()
})

const headers: { title: string, value?: string, sortable?: boolean }[] = []
if ($uiConfig.avatars.orgs) headers.push({ title: '', sortable: false })
headers.push({ title: t('common.name'), value: 'name', sortable: true })
headers.push({ title: t('common.id'), value: 'id', sortable: false })
headers.push({ title: t('common.description'), value: 'description', sortable: false })
if (!$uiConfig.readonly) {
  headers.push({ title: t('common.createdAt'), value: 'created.date', sortable: true })
  headers.push({ title: t('common.updatedAt'), value: 'updated.date', sortable: true })
}
headers.push({ title: '', value: 'actions', sortable: false })

</script>

<style lang="css">
</style>
