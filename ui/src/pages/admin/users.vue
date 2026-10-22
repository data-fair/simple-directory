<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-title-large mb-3">
        {{ $t('common.users') }} <span v-if="users.data.value">({{ $n(users.data.value.count) }})</span>
      </h2>
    </v-row>

    <v-row class="mb-3 mx-0">
      <p v-if="$uiConfig.quotas.defaultMaxCreatedOrgs === -1">
        {{ $t('pages.admin.users.noCreatedOrgsLimit') }}
      </p>
      <p v-else>
        {{ $t('pages.admin.users.createdOrgsLimit', {defaultMaxCreatedOrgs: $uiConfig.quotas.defaultMaxCreatedOrgs}) }}
      </p>
    </v-row>

    <v-row
      v-if="users.data.value?.fromCache"
      class="mb-3 mx-0"
    >
      Dernière synchronisation de cette liste avec le fournisseur d'identités : {{ dayjs(users.data.value?.fromCache).fromNow() }}.
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
            <confirm-menu
              v-if="!$uiConfig.readonly"
              :title="$t('pages.admin.users.editUserEmailTitle', {name: props.item.name})"
              :alert="$t('pages.admin.users.editUserEmailText')"
              yes-color="warning"
              @update:model-value="(open: boolean) => { if (open) email = props.item.email }"
              @confirm="saveUserEmail.execute(props.item)"
            >
              <template #activator="{props: activatorProps}">
                <v-btn
                  :title="$t('pages.admin.users.editUserEmailTitle', {name: props.item.name})"
                  :aria-label="$t('pages.admin.users.editUserEmailTitle', {name: props.item.name})"
                  :icon="mdiPencil"
                  size="small"
                  variant="text"
                  v-bind="activatorProps"
                />
              </template>
              <v-text-field
                v-model="email"
                :label="$t('common.email')"
                variant="outlined"
                density="compact"
                hide-details
                class="mt-4"
              />
            </confirm-menu>
          </td>
          <td class="text-no-wrap">
            {{ props.item.name }}
          </td>
          <td class="text-no-wrap">
            {{ props.item.id }}
          </td>
          <!--<td class="text-no-wrap">
            {{ props.item.firstName }}
          </td>
          <td class="text-no-wrap">
            {{ props.item.lastName }}
          </td>-->
          <td>
            <template v-if="props.item['2FA'] && props.item['2FA'].active">
              {{ $t('common.yes') }}
              <confirm-menu
                :title="$t('pages.admin.users.drop2FATitle', {name: props.item.name})"
                :alert="$t('pages.admin.users.drop2FAExplain')"
                yes-color="warning"
                @confirm="drop2FA.execute(props.item)"
              >
                <template #activator="{props: activatorProps}">
                  <v-btn
                    :title="$t('pages.admin.users.drop2FATitle', {name: props.item.name})"
                    :aria-label="$t('pages.admin.users.drop2FATitle', {name: props.item.name})"
                    :icon="mdiDelete"
                    size="small"
                    variant="text"
                    v-bind="activatorProps"
                  />
                </template>
              </confirm-menu>
            </template>
            <span v-else>{{ $t('common.no') }}</span>
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
                <template v-if="orga.department"> / {{ orga.departmentName || orga.department }}</template>
                ({{ orga.roleLabel || orga.role }})
              </span>
            </div>
          </td>
          <td v-if="$uiConfig.quotas.defaultMaxCreatedOrgs !== -1 && !$uiConfig.readonly">
            <div class="d-flex">
              <span class="mt-2">{{ props.item.maxCreatedOrgs }}</span>
              <confirm-menu
                v-if="$uiConfig.quotas.defaultMaxCreatedOrgs !== -1"
                :title="$t('common.editTitle', {name: props.item.name})"
                yes-color="warning"
                @update:model-value="(open: boolean) => { if (open) initMaxCreatedOrgs(props.item) }"
                @confirm="saveMaxCreatedOrgs.execute(props.item)"
              >
                <template #activator="{props: activatorProps}">
                  <v-btn
                    :title="$t('common.editTitle', {name: $t('common.maxCreatedOrgs').toLowerCase()})"
                    :aria-label="$t('common.editTitle', {name: $t('common.maxCreatedOrgs').toLowerCase()})"
                    :icon="mdiPencil"
                    size="small"
                    variant="text"
                    v-bind="activatorProps"
                  />
                </template>
                <p class="mb-3">
                  {{ $t('pages.admin.users.explainLimit', {defaultMaxCreatedOrgs: $uiConfig.quotas.defaultMaxCreatedOrgs}) }}
                </p>
                <p
                  v-if="nbCreatedOrgs !== undefined"
                  class="mb-3"
                >
                  {{ $t('common.nbCreatedOrgs') + ' ' + nbCreatedOrgs }}
                </p>
                <v-text-field
                  id="maxCreatedOrgs"
                  v-model.number="newMaxCreatedOrgs"
                  :label="$t('common.maxCreatedOrgs')"
                  name="maxCreatedOrgs"
                  type="number"
                  variant="outlined"
                  density="compact"
                  hide-details
                />
              </confirm-menu>
            </div>
          </td>
          <template v-if="!$uiConfig.readonly">
            <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
            <td
              v-if="$uiConfig.manageSites"
              class="text-no-wrap"
            >
              {{ props.item.host && (props.item.host + (props.item.path ?? '')) }}
              <confirm-menu
                v-if="!props.item.isAdmin"
                :title="$t('pages.admin.users.transferTitle', {name: props.item.name})"
                :alert="$t('pages.admin.users.transferText')"
                yes-color="warning"
                :disabled="!transferTarget"
                @update:model-value="(open: boolean) => { if (open) transferTarget = undefined }"
                @confirm="transferUser.execute(props.item)"
              >
                <template #activator="{props: activatorProps}">
                  <v-btn
                    :title="$t('common.transfer')"
                    :aria-label="$t('common.transfer')"
                    :icon="mdiSwapHorizontal"
                    size="small"
                    variant="text"
                    v-bind="activatorProps"
                  />
                </template>
                <v-autocomplete
                  v-model="transferTarget"
                  :items="transferSiteItems"
                  :label="$t('pages.admin.users.transferTargetSite')"
                  item-title="title"
                  return-object
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mt-4"
                />
              </confirm-menu>
            </td>
            <td>{{ props.item.updated && $d(new Date(props.item.updated.date)) }}</td>
            <td>{{ props.item.logged && $d(new Date(props.item.logged)) }}</td>
            <td>{{ props.item.plannedDeletion && $d(new Date(props.item.plannedDeletion)) }}</td>
            <td>
              <div class="d-flex">
                <v-btn
                  v-if="$uiConfig.asAdmin"
                  :title="$t('common.asAdmin')"
                  :aria-label="$t('common.asAdmin')"
                  color="admin"
                  :icon="mdiAccountSwitch"
                  variant="text"
                  @click="asAdmin(props.item)"
                />
                <confirm-menu
                  :title="$t('common.confirmDeleteTitle', {name: props.item.name})"
                  yes-color="warning"
                  @confirm="deleteUser.execute(props.item)"
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
                  :title="$t('common.asAdmin')"
                  :aria-label="$t('common.asAdmin')"
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
const { asAdmin } = useSession()
const { dayjs } = useLocaleDayjs()

const validQ = useStringSearchParam('q')
const q = ref(validQ.value)
const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref<{ key: string, order: 'asc' | 'desc' }[]>([{ key: 'email', order: 'asc' }])
const sort = computed(() => {
  if (!sortBy.value.length) return ''
  return (sortBy.value[0].order === 'desc' ? '-' : '') + sortBy.value[0].key
})
const usersQuery = computed(() => ({ q: validQ.value, allFields: true, page: page.value, size: itemsPerPage.value, sort: sort.value }))
const users = useFetch<{ count: number, results: User[], fromCache?: string }>($apiPath + '/users', { query: usersQuery })

const deleteUser = useAsyncAction(async (user: User) => {
  await $fetch(`users/${user.id}`, { method: 'DELETE' })
  users.refresh()
})

const nbCreatedOrgs = ref<number>()
const newMaxCreatedOrgs = ref<number>()
const initMaxCreatedOrgs = async (user: User) => {
  nbCreatedOrgs.value = undefined
  newMaxCreatedOrgs.value = user.maxCreatedOrgs
  nbCreatedOrgs.value = (await $fetch('organizations', { params: { creator: user.id, size: 0 } })).count
}
const saveMaxCreatedOrgs = useAsyncAction(async (user: User) => {
  if (newMaxCreatedOrgs.value === undefined) return
  await $fetch(`users/${user.id}`, { method: 'PATCH', body: { maxCreatedOrgs: newMaxCreatedOrgs.value } })
  user.maxCreatedOrgs = newMaxCreatedOrgs.value
})

const email = ref<string>()
const saveUserEmail = useAsyncAction(async (user: User) => {
  if (email.value === undefined) return
  await $fetch(`users/${user.id}`, { method: 'PATCH', body: { email: email.value } })
  user.email = email.value
})

const drop2FA = useAsyncAction(async (user: User) => {
  // null unsets the whole 2FA configuration, the user will have to enrol again
  await $fetch(`users/${user.id}`, { method: 'PATCH', body: { '2FA': null } })
})

type TransferTarget = { title: string, host?: string, path?: string }
const sites = useFetch<{ results: Site[] }>($apiPath + '/sites', { query: { showAll: true } })
const transferSiteItems = computed<TransferTarget[]>(() => {
  const items: TransferTarget[] = [{ title: t('pages.admin.users.transferMainSite'), host: '' }]
  for (const site of sites.data.value?.results ?? []) {
    items.push({ title: site.host + (site.path ?? ''), host: site.host, path: site.path })
  }
  return items
})
const transferTarget = ref<TransferTarget>()
const transferUser = useAsyncAction(async (user: User) => {
  if (transferTarget.value === undefined) return
  const body: { host?: string, path?: string } = {}
  if (transferTarget.value.host) {
    body.host = transferTarget.value.host
    if (transferTarget.value.path) body.path = transferTarget.value.path
  }
  await $fetch(`users/${user.id}/transfer`, { method: 'POST', body })
  users.refresh()
})

const headers: { title: string, value?: string, sortable?: boolean }[] = []
if ($uiConfig.avatars.users) headers.push({ title: '', sortable: false })
headers.push({ title: t('common.email'), value: 'email', sortable: true })
headers.push({ title: t('common.name'), value: 'name', sortable: true })
headers.push({ title: t('common.id'), value: 'id', sortable: false })
// headers.push({ title: t('common.firstName'), value: 'firstName' })
// headers.push({ title: t('common.lastName'), value: 'lastName' })
headers.push({ title: '2FA', value: '2FA', sortable: false })
headers.push({ title: t('common.organizations'), value: 'organizations', sortable: false })
if ($uiConfig.quotas.defaultMaxCreatedOrgs !== -1 && !$uiConfig.readonly) {
  headers.push({ title: t('common.maxCreatedOrgsShort'), value: 'maxCreatedOrgs', sortable: false })
}
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
  padding-left: 4px;
  padding-right: 4px;
}
</style>
