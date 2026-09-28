<template>
  <div>
    <v-row class="mb-3 mx-0">
      <v-text-field
        v-model="q"
        :label="$t('common.search')"
        name="search"
        variant="solo"
        density="comfortable"
        style="max-width:300px;"
        :append-inner-icon="mdiMagnify"
        hide-details
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
      class="site-users-table border-sm"
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
          </td>
          <td class="text-no-wrap">
            {{ props.item.email }}
          </td>
          <td class="text-no-wrap">
            {{ props.item.name }}
          </td>
          <td>
            <div
              v-for="orga in props.item.organizations"
              :key="orga.id + (orga.department ?? '')"
            >
              <span style="white-space:nowrap">
                <router-link
                  class="text-primary"
                  :to="`/organization/${orga.id}`"
                >{{ orga.name }}</router-link>
                <template v-if="orga.department"> {{ orga.departmentName || orga.department }}</template>
                ({{ orga.roleLabel || orga.role }})
              </span>
            </div>
          </td>
          <td class="text-no-wrap">
            <template v-if="props.item['2FA']?.active">
              {{ $t('common.yes') }}
              <v-btn
                v-if="isOther(props.item)"
                :title="$t('pages.admin.users.drop2FATitle', {name: props.item.name})"
                :aria-label="$t('pages.admin.users.drop2FATitle', {name: props.item.name})"
                :icon="mdiDelete"
                size="small"
                variant="text"
                @click="openDialog('drop2FA', props.item)"
              />
            </template>
            <span v-else>{{ $t('common.no') }}</span>
          </td>
          <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
          <td>{{ props.item.logged && $d(new Date(props.item.logged)) }}</td>
          <td class="text-no-wrap">
            <template v-if="props.item.plannedDeletion">
              {{ $d(new Date(props.item.plannedDeletion)) }}
              <v-btn
                v-if="isOther(props.item)"
                :title="$t('pages.siteAdmin.cancelDeletion', {name: props.item.name})"
                :aria-label="$t('pages.siteAdmin.cancelDeletion', {name: props.item.name})"
                :icon="mdiCancel"
                size="small"
                variant="text"
                @click="cancelDeletion.execute(props.item)"
              />
            </template>
          </td>
          <td>
            <div
              v-if="isOther(props.item)"
              class="d-flex"
            >
              <v-btn
                :title="$t('pages.siteAdmin.revokeSessions', {name: props.item.name})"
                :aria-label="$t('pages.siteAdmin.revokeSessions', {name: props.item.name})"
                :icon="mdiLogout"
                variant="text"
                @click="openDialog('revokeSessions', props.item)"
              />
              <v-btn
                :title="$t('common.confirmDeleteTitle', {name: props.item.name})"
                :aria-label="$t('common.confirmDeleteTitle', {name: props.item.name})"
                color="warning"
                :icon="mdiDelete"
                variant="text"
                @click="openDialog('delete', props.item)"
              />
            </div>
          </td>
        </tr>
      </template>
    </v-data-table-server>

    <v-dialog
      :model-value="!!dialog"
      max-width="500px"
      @update:model-value="dialog = null"
    >
      <v-card v-if="dialog">
        <v-card-title>
          <template v-if="dialog.action === 'delete'">
            {{ $t('common.confirmDeleteTitle', {name: dialog.user.name}) }}
          </template>
          <template v-else-if="dialog.action === 'drop2FA'">
            {{ $t('pages.admin.users.drop2FATitle', {name: dialog.user.name}) }}
          </template>
          <template v-else>
            {{ $t('pages.siteAdmin.revokeSessions', {name: dialog.user.name}) }}
          </template>
        </v-card-title>
        <v-card-text>
          <template v-if="dialog.action === 'delete'">
            {{ $t('pages.siteAdmin.confirmDeleteMsg', {email: dialog.user.email}) }}
          </template>
          <v-alert
            v-else-if="dialog.action === 'drop2FA'"
            type="warning"
          >
            {{ $t('pages.admin.users.drop2FAExplain') }}
          </v-alert>
          <template v-else>
            {{ $t('pages.siteAdmin.confirmRevokeSessionsMsg') }}
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="dialog = null"
          >
            {{ $t('common.confirmCancel') }}
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            :loading="confirmAction.loading.value"
            @click="confirmAction.execute()"
          >
            {{ $t('common.confirmOk') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
// Accounts of the current site, for the admins of the organization that owns it (siteAdmin).
// The api confines both the list and the actions to the accounts whose host/path is the
// current site's; impersonation (asAdmin) is deliberately not offered here.
const { t } = useI18n()
const session = useSession()

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
headers.push({ title: t('common.organizations'), value: 'organizations', sortable: false })
headers.push({ title: t('common.2FA'), value: '2FA', sortable: false })
headers.push({ title: t('common.createdAt'), value: 'created.date', sortable: true })
headers.push({ title: t('common.loggedAt'), value: 'logged', sortable: true })
headers.push({ title: t('common.plannedDeletionShort'), value: 'plannedDeletion', sortable: true })
headers.push({ title: '', value: 'actions', sortable: false })

// actions on their own account go through the personal page, not this list
const isOther = (user: User) => user.id !== session.user.value?.id

type Action = 'delete' | 'drop2FA' | 'revokeSessions'
const dialog = ref<{ action: Action, user: User } | null>(null)
const openDialog = (action: Action, user: User) => { dialog.value = { action, user } }

const confirmAction = useAsyncAction(async () => {
  if (!dialog.value) return
  const { action, user } = dialog.value
  if (action === 'delete') await $fetch(`users/${user.id}`, { method: 'DELETE' })
  // null unsets the whole 2FA configuration, the user will have to enrol again
  else if (action === 'drop2FA') await $fetch(`users/${user.id}`, { method: 'PATCH', body: { '2FA': null } })
  else await $fetch(`users/${user.id}/sessions`, { method: 'DELETE' })
  dialog.value = null
  users.refresh()
}, { success: t('common.modificationOk') })

const cancelDeletion = useAsyncAction(async (user: User) => {
  await $fetch(`users/${user.id}/plannedDeletion`, { method: 'DELETE' })
  users.refresh()
}, { success: t('common.modificationOk') })
</script>

<style lang="css">
.site-users-table td, .site-users-table th {
  padding-left: 4px !important;
  padding-right: 4px !important;
}
</style>
