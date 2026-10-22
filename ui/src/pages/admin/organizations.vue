<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-title-large mb-3">
        {{ $t('common.organizations') }} <span v-if="organizations.data.value">({{ $n(organizations.data.value.count) }})</span>
      </h2>
      <add-organization-menu
        :auto-admin="false"
        mode="icon"
      />
    </v-row>

    <v-row
      v-if="organizations.data.value?.fromCache"
      class="mb-3 mx-0"
    >
      {{ $t('pages.admin.organizations.fromCache') }} {{ dayjs(organizations.data.value?.fromCache).fromNow() }}.
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
      :search="validQ"
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
            <td v-if="$uiConfig.manageSites && $uiConfig.siteOrgs">
              {{ props.item.host && (props.item.host + (props.item.path ?? '')) }}
            </td>
            <td>{{ props.item.updated && $d(new Date(props.item.updated.date)) }}</td>
            <td>
              <div class="d-flex">
                <confirm-menu
                  :title="$t('pages.admin.organizations.limitOrganizationTitle', {name: props.item.name})"
                  yes-color="warning"
                  @update:model-value="(open: boolean) => { if (open) currentLimits = JSON.parse(JSON.stringify(limits[props.item.id])) }"
                  @confirm="saveLimits.execute(props.item, currentLimits)"
                >
                  <template #activator="{props: activatorProps}">
                    <v-btn
                      :loading="!limits[props.item.id]"
                      :color="!limits[props.item.id] ? 'default' : (isOverLimit(limits[props.item.id]) ? 'warning' : 'primary')"
                      size="small"
                      rounded
                      class="mt-3 text-lowercase"
                      v-bind="activatorProps"
                    >
                      <template v-if="limits[props.item.id]">
                        <template v-if="!limits[props.item.id].store_nb_members || !limits[props.item.id].store_nb_members.consumption">
                          {{ $t('common.missingInfo') }}
                        </template>
                        <template v-else-if="limits[props.item.id].store_nb_members.limit === 0">
                          {{ limits[props.item.id].store_nb_members.consumption.toLocaleString() }} {{ $t('pages.admin.organizations.members') }}
                        </template>
                        <template v-else>
                          {{ limits[props.item.id].store_nb_members.consumption.toLocaleString() }} / {{ limits[props.item.id].store_nb_members.limit.toLocaleString() }} {{ $t('pages.admin.organizations.members') }}
                        </template>
                      </template>
                    </v-btn>
                  </template>
                  <v-text-field
                    v-if="currentLimits"
                    v-model.number="currentLimits.store_nb_members.limit"
                    :label="$t('pages.admin.organizations.nbMembers')"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                  />
                </confirm-menu>
                <v-btn
                  :title="$t('common.editTitle', {name: props.item.name})"
                  :aria-label="$t('common.editTitle', {name: props.item.name})"
                  :to="`/organization/${props.item.id}`"
                  :icon="mdiPencil"
                  variant="text"
                />
                <confirm-menu
                  :title="$t('common.confirmDeleteTitle', {name: props.item.name})"
                  yes-color="warning"
                  @confirm="deleteOrganization.execute(props.item)"
                >
                  <template #activator="{props: activatorProps}">
                    <v-btn
                      :title="$t('common.delete')"
                      :aria-label="$t('common.delete')"
                      color="warning"
                      :icon="mdiDelete"
                      variant="text"
                      v-bind="activatorProps"
                    />
                  </template>
                  {{ $t('common.confirmDeleteMsg') }}
                </confirm-menu>
              </div>
            </td>
          </template>
          <template v-else>
            <td>
              <div class="d-flex">
                <v-btn
                  :title="$t('common.seeTitle', {name: props.item.name})"
                  :aria-label="$t('common.seeTitle', {name: props.item.name})"
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
  </v-container>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { dayjs } = useLocaleDayjs()

const validQ = useStringSearchParam('q')
const q = ref(validQ.value)
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref<{ key: string, order: 'asc' | 'desc' }[]>([{ key: 'name', order: 'asc' }])
const sort = computed(() => {
  if (!sortBy.value.length) return ''
  return (sortBy.value[0].order === 'desc' ? '-' : '') + sortBy.value[0].key
})
const organizationsQuery = computed(() => ({ q: validQ.value, allFields: true, page: page.value, size: itemsPerPage.value, sort: sort.value }))
const organizations = useFetch<{ count: number, results: Organization[], fromCache?: string }>($apiPath + '/organizations', { query: organizationsQuery })

const currentLimits = ref<Limits | null>(null)

const deleteOrganization = useAsyncAction(async (org) => {
  await $fetch(`organizations/${org.id}`, { method: 'DELETE' })
  organizations.refresh()
})

const limits = reactive<Record<string, Limits>>({})
const fetchLimits = useAsyncAction(async () => {
  if (!organizations.data.value) return
  for (const org of organizations.data.value.results) {
    if (!limits[org.id]) {
      limits[org.id] = await $fetch(`limits/organization/${org.id}`)
    }
  }
})
if (!$uiConfig.readonly) watch(organizations.data, () => fetchLimits.execute())

// a limit of 0 means no limit
const isOverLimit = (orgLimits: Limits) => !!orgLimits.store_nb_members.limit && orgLimits.store_nb_members.consumption >= orgLimits.store_nb_members.limit

const saveLimits = useAsyncAction(async (org: Organization, newLimits: Limits | null) => {
  if (!newLimits) return
  if (!newLimits.store_nb_members.limit) newLimits.store_nb_members.limit = 0
  limits[org.id] = await $fetch(`limits/organization/${org.id}`, { body: newLimits, method: 'POST' })
})

const headers: { title: string, value?: string, sortable?: boolean }[] = []
if ($uiConfig.avatars.orgs) headers.push({ title: '', sortable: false })
headers.push({ title: t('common.name'), value: 'name', sortable: true })
headers.push({ title: t('common.id'), value: 'id', sortable: false })
headers.push({ title: t('common.description'), value: 'description', sortable: false })
if (!$uiConfig.readonly) {
  headers.push({ title: t('common.createdAt'), value: 'created.date', sortable: true })
  if ($uiConfig.manageSites && $uiConfig.siteOrgs) {
    headers.push({ title: t('common.host'), value: 'host', sortable: true })
  }
  headers.push({ title: t('common.updatedAt'), value: 'updated.date', sortable: true })
}
headers.push({ title: '', value: 'actions', sortable: false })

</script>

<style lang="css">
</style>
