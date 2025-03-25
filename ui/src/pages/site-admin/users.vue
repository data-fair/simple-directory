<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h6 mb-3">
        {{ $t('common.users') }} <span v-if="users.data.value">({{ $n(users.data.value.count) }})</span>
      </h2>
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
      :items="users.data.value?.results"
      :items-length="users.data.value?.count || 0"
      :loading="users.loading.value"
      class="users-table border-sm"
      density="compact"
      item-key="id"
      :items-per-page-options="[10, 25, 100]"
      :multi-sort="false"
      :must-sort="true"
    >
      <template #item="props">
        <tr>
          <td v-if="$uiConfig.avatars.users">
            <v-avatar
              :size="36"
              class="ml-2"
              :image="$sdUrl + '/api/avatars/user/' + props.item.id + '/avatar.png'"
            />
          </td><td class="text-no-wrap">
            {{ props.item.email }}
          </td>
          <td class="text-no-wrap">
            {{ props.item.name }}
          </td>
          <td class="text-no-wrap">
            {{ props.item.id }}
          </td>
          <td>
            <div
              v-for="orga in props.item.organizations"
              :key="orga.id"
            >
              <span style="white-space:nowrap">
                <router-link
                  class="text-primary"
                  :to="`/organization/${orga.id}`"
                >{{ orga.name }}</router-link>
                <template v-if="orga.department">{{ orga.departmentName || orga.department }}</template>
                ({{ orga.role }})
              </span>
            </div>
          </td>
          <template v-if="!$uiConfig.readonly">
            <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
            <td v-if="$uiConfig.manageSites">
              {{ props.item.host && (props.item.host + (props.item.path ?? '')) }}
            </td>
            <td>{{ props.item.updated && $d(new Date(props.item.updated.date)) }}</td>
            <td>{{ props.item.logged && $d(new Date(props.item.logged)) }}</td>
            <td>{{ props.item.plannedDeletion && $d(new Date(props.item.plannedDeletion)) }}</td>
            <td>
              <div class="d-flex">
                <v-btn
                  :title="$t('common.asAdmin')"
                  color="admin"
                  :icon="mdiAccountSwitch"
                  variant="text"
                  @click="asAdmin(props.item)"
                />
              </div>
            </td>
          </template>
          <template v-else>
            <td>
              <div class="d-flex">
                <v-btn
                  :title="$t('common.asAdmin')"
                  color="admin"
                  :icon="mdiAccountSwitch"
                  variant="text"
                  @click="asAdmin(props.item)"
                />
              </div>
            </td>
          </template>
        </tr>
      </template>
    </v-data-table-server>
  </v-container>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { asAdmin, site: siteRef } = useSession()

const site = siteRef.value
if (!site) {
  throw new Error('No site')
}

const validQ = useStringSearchParam('q')
const q = ref(validQ.value)
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref<{ key: string, order: 'asc' | 'desc' }[]>([{ key: 'email', order: 'asc' }])
const sort = computed(() => {
  if (!sortBy.value.length) return ''
  return (sortBy.value[0].order === 'desc' ? '-' : '') + sortBy.value[0].key
})
const usersQuery = computed(() => ({ q: validQ.value, allFields: true, page: page.value, size: itemsPerPage.value, sort: sort.value, host: window.location.host, path: $sitePath || undefined }))
const users = useFetch<{ count: number, results: User[] }>($apiPath + '/users', { query: usersQuery })

const headers: { title: string, value?: string, sortable?: boolean }[] = []
if ($uiConfig.avatars.users) headers.push({ title: '', sortable: false })
headers.push({ title: t('common.email'), value: 'email', sortable: true })
headers.push({ title: t('common.name'), value: 'name', sortable: true })
headers.push({ title: t('common.id'), value: 'id', sortable: false })
headers.push({ title: t('common.organizations'), value: 'organizations', sortable: false })
if (!$uiConfig.readonly) {
  headers.push({ title: t('common.createdAt'), value: 'created.date', sortable: true })
  if ($uiConfig.manageSites) {
    headers.push({ title: t('common.host'), value: 'host', sortable: true })
  }
  headers.push({ title: t('common.updatedAt'), value: 'updated.date', sortable: true })
  headers.push({ title: t('common.loggedAt'), value: 'logged', sortable: true })
  headers.push({ title: t('common.plannedDeletionShort'), value: 'plannedDeletion', sortable: true })
}
headers.push({ title: '', value: 'actions', sortable: false })
</script>

<style lang="css">
.users-table td, .users-table th {
  padding-left: 4px !important;
  padding-right: 4px !important;
}
</style>
