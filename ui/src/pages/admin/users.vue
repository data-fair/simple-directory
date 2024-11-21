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
      <p v-if="$uiConfig.quotas.defaultMaxCreatedOrgs === -1">
        {{ $t('pages.admin.users.noCreatedOrgsLimit') }}
      </p>
      <p v-else>
        {{ $t('pages.admin.users.createdOrgsLimit', {defaultMaxCreatedOrgs: $uiConfig.quotas.defaultMaxCreatedOrgs}) }}
      </p>
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

    <v-data-table
      v-if="users"
      v-model:options="pagination"
      :headers="headers"
      :items="users.data.value?.results"
      :items-length="pagination.totalItems"
      :loading="users.loading.value"
      class="users-table border-sm"
      density="compact"
      item-key="id"
      :footer-props="{itemsPerPageOptions: [10, 25, 100], itemsPerPageText: ''}"
    >
      <template #item="props">
        <tr>
          <td v-if="$uiConfig.avatars.users">
            <v-avatar
              :size="36"
              class="ml-2"
            >
              <img :src="$sdUrl + '/api/avatars/user/' + props.item.id + '/avatar.png'">
            </v-avatar>
          </td><td class="text-no-wrap">
            {{ props.item.email }}
            <v-btn
              v-if="!$uiConfig.readonly"
              :icon="mdiPencil"
              size="small"
              variant="text"
              @click="showEditUserEmailDialog(props.item)"
            />
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
              oui
              <v-btn
                :icon="mdiDelete"
                size="small"
                variant="text"
                @click="showDrop2FADialog(props.item)"
              />
            </template>
            <span v-else>non</span>
          </td>
          <td>
            <div
              v-for="orga in props.item.organizations"
              :key="orga.id"
            >
              <span style="white-space:nowrap">
                <router-link :to="`/organizations/${orga.id}`">{{ orga.name }}</router-link>
                <template v-if="orga.department">{{ orga.departmentName || orga.department }}</template>
                ({{ orga.role }})
              </span>
            </div>
          </td>
          <td v-if="$uiConfig.quotas.defaultMaxCreatedOrgs !== -1 && !$uiConfig.readonly">
            <div class="d-flex">
              <span class="mt-2">{{ props.item.maxCreatedOrgs }}</span>
              <v-btn
                v-if="$uiConfig.quotas.defaultMaxCreatedOrgs !== -1"
                :icon="mdiPencil"
                size="small"
                variant="text"
                @click="showEditMaxCreatedOrgsDialog(props.item)"
              />
            </div>
          </td>
          <template v-if="!$uiConfig.readonly">
            <td>{{ props.item.created && $d(new Date(props.item.created.date)) }}</td>
            <td v-if="$uiConfig.manageSites">
              {{ props.item.host }}
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
                <v-btn
                  :title="$t('common.delete')"
                  color="warning"
                  :icon="mdiDelete"
                  variant="text"
                  @click="currentUser = props.item;deleteUserDialog = true"
                />
              </div>
            </td>
          </template>
          <template v-else>
            <v-btn
              :title="$t('common.asAdmin')"
              icon
              class="mx-0"
              @click="asAdmin(props.item)"
            >
              <v-icon
                color="warning"
                :icon="mdiAccountSwitch"
              />
            </v-btn>
          </template>
        </tr>
      </template>
    </v-data-table>

    <v-dialog
      v-model="deleteUserDialog"
      max-width="500px"
    >
      <v-card v-if="currentUser">
        <v-card-title>
          {{ $t('common.confirmDeleteTitle', {name: currentUser.name}) }}
        </v-card-title>
        <v-card-text>
          {{ $t('common.confirmDeleteMsg') }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="deleteUserDialog = false"
          >
            {{ $t('common.confirmCancel') }}
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            @click="deleteUserDialog = false;deleteUser(currentUser)"
          >
            {{ $t('common.confirmOk') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="editUserEmailDialog"
      max-width="500px"
    >
      <v-card v-if="currentUser">
        <v-card-title>
          {{ $t('pages.admin.users.editUserEmailTitle', {name: currentUser.name}) }}
        </v-card-title>
        <v-card-text>
          <v-alert
            :value="true"
            type="warning"
            class="mb-3"
          >
            {{ $t('pages.admin.users.editUserEmailText') }}
          </v-alert>
          <v-text-field v-model="email" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="editUserEmailDialog = false"
          >
            {{ $t('common.confirmCancel') }}
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            @click="editUserEmailDialog = false;saveCurrentUserEmail()"
          >
            {{ $t('common.confirmOk') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="editMaxCreatedOrgsDialog"
      max-width="500px"
    >
      <v-card v-if="currentUser">
        <v-card-title>
          {{ $t('common.editTitle', {name: currentUser.name}) }}
        </v-card-title>
        <v-card-text>
          <p class="mb-3">
            {{ $t('pages.admin.users.explainLimit', {defaultMaxCreatedOrgs: $uiConfig.quotas.defaultMaxCreatedOrgs}) }}
          </p>
          <p
            v-if="nbCreatedOrgs !== null"
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
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="editMaxCreatedOrgsDialog = false"
          >
            {{ $t('common.confirmCancel') }}
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            @click="editMaxCreatedOrgsDialog = false;saveCurrentUserMaxCreatedOrgs()"
          >
            {{ $t('common.confirmOk') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="drop2FADialog"
      max-width="500px"
    >
      <v-card v-if="currentUser">
        <v-card-title>
          {{ $t('pages.admin.users.drop2FATitle', {name: currentUser.name}) }}
        </v-card-title>
        <v-card-text>
          <v-alert
            :value="true"
            type="warning"
          >
            {{ $t('pages.admin.users.drop2FAExplain') }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            @click="drop2FADialog = false"
          >
            {{ $t('common.confirmCancel') }}
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            @click="drop2FADialog = false;drop2FACurrentUser()"
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
const { asAdmin } = useSession()

const q = ref('')
const validQ = ref('')
const pagination = reactive({ page: 1, itemsPerPage: 10, totalItems: 0, sortBy: ['email'], sortDesc: [false], multiSort: false, mustSort: true })
const sort = computed(() => {
  if (!pagination.sortBy.length) return ''
  return (pagination.sortDesc[0] ? '-' : '') + pagination.sortBy[0]
})
const usersQuery = computed(() => ({ q: validQ.value, allFields: true, page: pagination.page, size: pagination.itemsPerPage, sort: sort.value }))
const users = useFetch<{ count: number, results: User[] }>(() => withQuery($apiPath + '/users', usersQuery.value))

const deleteUserDialog = ref(false)
const deleteUser = withUiNotif(async (user: User) => {
  await $fetch(`users/${user.id}`, { method: 'DELETE' })
})

const currentUser = ref<User>()
const nbCreatedOrgs = ref<number>()
const newMaxCreatedOrgs = ref<number>()
const editMaxCreatedOrgsDialog = ref(false)
const showEditMaxCreatedOrgsDialog = async (user: User) => {
  currentUser.value = undefined
  nbCreatedOrgs.value = undefined
  nbCreatedOrgs.value = (await $fetch('organizations', { params: { creator: user.id, size: 0 } })).count
  currentUser.value = user
  newMaxCreatedOrgs.value = user.maxCreatedOrgs
  editMaxCreatedOrgsDialog.value = true
}
const saveCurrentUserMaxCreatedOrgs = withUiNotif(async () => {
  if (newMaxCreatedOrgs.value === undefined || currentUser.value === undefined) return
  await $fetch(`users/${currentUser.value.id}`, { method: 'PATCH', body: { maxCreatedOrgs: newMaxCreatedOrgs.value } })
  currentUser.value.maxCreatedOrgs = newMaxCreatedOrgs.value
})

const email = ref<string>()
const editUserEmailDialog = ref(false)
const showEditUserEmailDialog = (user: User) => {
  currentUser.value = user
  email.value = user.email
  editUserEmailDialog.value = true
}
const saveCurrentUserEmail = withUiNotif(async () => {
  if (email.value === undefined || currentUser.value === undefined) return
  await $fetch(`users/${currentUser.value.id}`, { method: 'PATCH', body: { email: email.value } })
  currentUser.value.email = email.value
})

const drop2FADialog = ref(false)
const showDrop2FADialog = (user: User) => {
  currentUser.value = user
  drop2FADialog.value = true
}
const drop2FACurrentUser = withUiNotif(async () => {
  if (currentUser.value === undefined) return
  await $fetch(`users/${currentUser.value.id}`, { method: 'PATCH', body: { '2FA': { active: false } } })
})

const headers: { title: string, value?: string, sortable?: boolean }[] = []
if ($uiConfig.avatars.users) headers.push({ title: '', sortable: false })
headers.push({ title: t('common.email'), value: 'email' })
headers.push({ title: t('common.name'), value: 'name' })
headers.push({ title: t('common.id'), value: 'id', sortable: false })
// headers.push({ title: t('common.firstName'), value: 'firstName' })
// headers.push({ title: t('common.lastName'), value: 'lastName' })
headers.push({ title: '2FA', value: '2FA', sortable: false })
headers.push({ title: t('common.organizations'), value: 'organizations', sortable: false })
if ($uiConfig.quotas.defaultMaxCreatedOrgs !== -1 && !$uiConfig.readonly) {
  headers.push({ title: t('common.maxCreatedOrgsShort'), value: 'maxCreatedOrgs', sortable: false })
}
if (!$uiConfig.readonly) {
  headers.push({ title: t('common.createdAt'), value: 'created.date' })
  if ($uiConfig.manageSites) {
    headers.push({ title: t('common.host'), value: 'host' })
  }
  headers.push({ title: t('common.updatedAt'), value: 'updated.date' })
  headers.push({ title: t('common.loggedAt'), value: 'logged' })
  headers.push({ title: t('common.plannedDeletionShort'), value: 'plannedDeletion' })
}
headers.push({ title: '', value: 'actions', sortable: false })
</script>

<style lang="css">
.users-table td, .users-table th {
  padding-left: 4px !important;
  padding-right: 4px !important;
}
</style>
