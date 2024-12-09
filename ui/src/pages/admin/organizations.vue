<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h6 mb-3">
        {{ $t('common.organizations') }} <span v-if="organizations.data.value">({{ $n(organizations.data.value.count) }})</span>
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
        @click:append="validQ = q"
        @keyup.enter="validQ = q"
      />
    </v-row>

    <v-data-table-server
      v-if="organizations.data.value"
      v-model:options="pagination"
      :headers="headers"
      :items="organizations.data.value.results"
      :items-length="pagination.totalItems"
      :loading="organizations.loading.value"
      class="border-sm"
      density="compact"
      item-key="id"
      :footer-props="{itemsPerPageOptions: [10, 25, 100], itemsPerPageText: ''}"
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
                  :loading="!limits[props.item.id]"
                  :color="!limits[props.item.id] ? 'default' : (limits[props.item.id].store_nb_members.consumption >= limits[props.item.id].store_nb_members.limit ? 'warning' : 'primary')"
                  size="small"
                  rounded
                  class="mt-3 text-lowercase"
                  @click="currentOrganization = props.item;currentLimits = JSON.parse(JSON.stringify(limits[props.item.id]));limitOrganizationDialog = true"
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
            <td class="justify-center layout px-0">
              <v-btn
                :to="`/organization/${props.item.id}`"
                icon
                class="mx-0"
              >
                <v-icon :icon="mdiEye" />
              </v-btn>
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

    <v-dialog
      v-model="limitOrganizationDialog"
      max-width="500px"
    >
      <v-card v-if="currentOrganization && currentLimits">
        <v-card-title>
          {{ $t('pages.admin.organizations.limitOrganizationTitle', {name: currentOrganization.name}) }}
        </v-card-title>
        <v-card-text v-if="currentLimits">
          <v-text-field
            v-model.number="currentLimits.store_nb_members.limit"
            :label="$t('pages.admin.organizations.nbMembers')"
            type="number"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="limitOrganizationDialog = false"
          >
            {{ $t('common.confirmCancel') }}
          </v-btn>
          <v-btn
            color="warning"
            @click="limitOrganizationDialog = false;saveLimits(currentOrganization, currentLimits)"
          >
            {{ $t('common.confirmOk') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { withQuery } from 'ufo'

const { t } = useI18n()

const q = ref('')
const validQ = ref('')
const pagination = reactive({ page: 1, itemsPerPage: 10, totalItems: 0, sortDesc: [false], sortBy: ['name'], multiSort: false, mustSort: true })
const sort = computed(() => {
  if (!pagination.sortBy.length) return ''
  return (pagination.sortDesc[0] ? '-' : '') + pagination.sortBy[0]
})
const organizationsQuery = computed(() => ({ q: validQ.value, allFields: true, page: pagination.page, size: pagination.itemsPerPage, sort: sort.value }))
const organizations = useFetch<{ count: number, results: Organization[] }>(() => withQuery($apiPath + '/organizations', organizationsQuery.value))

const deleteOrganizationDialog = ref(false)
const currentOrganization = ref<Organization | null>(null)
const limitOrganizationDialog = ref(false)
const currentLimits = ref<Limits | null>(null)

const deleteOrganization = withUiNotif(async (org) => {
  await $fetch(`organizations/${org.id}`, { method: 'DELETE' })
  organizations.refresh()
})

const limits = reactive<Record<string, Limits>>({})
const fetchLimits = withUiNotif(async () => {
  if (!organizations.data.value) return
  for (const org of organizations.data.value.results) {
    if (!limits[org.id]) {
      limits[org.id] = await $fetch(`limits/organization/${org.id}`)
    }
  }
})
if (!$uiConfig.readonly) watch(organizations.data, fetchLimits)

const saveLimits = withUiNotif(async (org: Organization, limits: Limits) => {
  if (!limits.store_nb_members.limit) limits.store_nb_members.limit = 0
  await $fetch(`limits/organization/${org.id}`, { body: limits, method: 'POST' })
  delete limits[org.id]
})

const headers: { title: string, value?: string, sortable?: boolean }[] = []
if ($uiConfig.avatars.orgs) headers.push({ title: '', sortable: false })
headers.push({ title: t('common.name'), value: 'name' })
headers.push({ title: t('common.id'), value: 'id', sortable: false })
headers.push({ title: t('common.description'), value: 'description', sortable: false })
if (!$uiConfig.readonly) {
  headers.push({ title: t('common.createdAt'), value: 'created.date' })
  headers.push({ title: t('common.updatedAt'), value: 'updated.date' })
}
headers.push({ title: '', value: 'actions', sortable: false })

</script>

<style lang="css">
</style>
