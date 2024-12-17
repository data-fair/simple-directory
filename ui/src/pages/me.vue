<template lang="html">
  <v-container
    data-iframe-height
    :fluid="$route.query.fluid === 'true'"
    :class="{'pa-0': $route.query.fluid === 'true'}"
    :style="$route.query.fluid === 'true' ? '' : 'max-width:600px;'"
  >
    <h2 class="text-h4 mb-4">
      <v-icon
        size="large"
        color="primary"
        style="top:-2px"
        :icon="mdiAccountCircle"
      />
      {{ $t('common.myAccount') }}
    </h2>
    <v-form
      v-if="user"
      ref="form"
      data-iframe-height
      @submit="save"
    >
      <v-text-field
        v-model="user.email"
        :label="$t('common.email')"
        :disabled="true"
        name="email"
      />

      <load-avatar
        v-if="userDetailsFetch.data.value && $uiConfig.avatars.users"
        :owner="{type: 'user', id: user.id}"
        :disabled="readonly"
      />

      <v-row dense>
        <v-col cols="6">
          <v-text-field
            v-model="patch.firstName"
            :label="$t('common.firstName')"
            :disabled="!userDetailsFetch.data.value || readonly"
            name="firstName"
            :rules="[v => (!v || v.length < 100) || $t('common.tooLong')]"
            variant="outlined"
            density="compact"
            @change="save"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="patch.lastName"
            :label="$t('common.lastName')"
            :disabled="!userDetailsFetch.data.value || readonly"
            name="lastName"
            :rules="[v => (!v || v.length < 100) || $t('common.tooLong')]"
            variant="outlined"
            density="compact"
            @change="save"
          />
        </v-col>
        <v-col
          v-if="!$uiConfig.noBirthday"
          cols="6"
        >
          <v-menu
            v-model="birthdayMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            max-width="290px"
            min-width="290px"
          >
            <template #activator="{ props }">
              <v-text-field
                :model-value="patch.birthday && $d(new Date(patch.birthday))"
                :label="$t('common.birthday')"
                :disabled="!userDetailsFetch.data.value || readonly"
                :append-icon="mdiCalendar"
                readonly
                clearable
                variant="outlined"
                density="compact"
                hide-details
                v-bind="props"
                @click:clear="patch.birthday = null; save()"
              />
            </template>
            <v-date-picker
              v-model:active-picker="activeBirthDayPicker"
              :model-value="patch.birthday ? new Date(patch.birthday) : undefined"
              :max="maxBirthday"
              no-title
              @update:model-value="setBirthDay"
            />
          </v-menu>
        </v-col>
        <v-col v-if="!readonly">
          <v-btn
            color="primary"
            variant="text"
            :title="$t('pages.login.changePasswordTooltip')"
            @click="changePasswordAction"
          >
            {{ $t('pages.login.changePassword') }}
          </v-btn>
        </v-col>
      </v-row>

      <v-row
        v-if="userIdentities.length"
        class="mx-0 mt-6"
      >
        <v-btn
          v-for="identity of userIdentities"
          :key="identity.type + identity.id"
          :color="identity.color"
          :href="identity.user.url"
          target="_blank"
          size="small"
          rounded
          variant="flat"
          class="pl-0 pr-3 mr-2 mb-1 text-none text-white"
        >
          <v-avatar
            size="28"
            :style="`left:-1px;top:-1px;background-color: ${$vuetify.theme.current.colors.surface};`"
            class="elevation-4"
          >
            <v-icon
              v-if="identity.icon"
              size="25"
              :color="identity.color"
            >
              {{ identity.icon }}
            </v-icon>
            <v-img
              v-else-if="identity.img"
              :src="identity.img"
              :alt="identity.title"
            />
          </v-avatar>
          &nbsp;&nbsp;{{ identity.title }}{{ identity.name ? ' - ' + identity.name : '' }}
        </v-btn>
      </v-row>

      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          size="small"
          color="primary"
          style="top:-2px"
          class="mb-1"
          :icon="mdiAccountGroup"
        />
        {{ $t('common.myOrganizations') }}
      </h2>

      <div v-if="userDetailsFetch.data.value">
        <template v-if="userDetailsFetch.data.value.organizations.length">
          <template
            v-for="orga in userDetailsFetch.data.value.organizations"
          >
            <span
              v-if="orga.role"
              :key="'org-' + orga.id + '-' + orga.department"
            >
              {{ orga.name }} <span v-if="orga.department">- {{ orga.departmentName || orga.department }}</span> ({{ orga.role }})
              <br>
            </span>
          </template>
        </template>
        <span v-else>
          {{ $t('pages.me.noOrganization') }}
        </span>
      </div>
      <br>
      <div v-if="showMaxCreatedOrgs">
        <p v-if="nbCreatedOrgs !== null">
          {{ $t('common.nbCreatedOrgs') + ' ' + nbCreatedOrgs }}
        </p>
        <p>{{ $t('common.maxCreatedOrgs') }} : {{ showMaxCreatedOrgs }}</p>
      </div>

      <add-organization-menu
        v-if="!readonly && nbCreatedOrgs !== undefined && (maxCreatedOrgs === -1 || maxCreatedOrgs > nbCreatedOrgs)"
      />

      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          size="small"
          color="primary"
          style="top:-2px"
          :icon="mdiMonitorCellphoneStar"
        />
        {{ $t('pages.me.sessions') }}
      </h2>

      <v-list>
        <v-list-item
          v-for="session of userDetailsFetch.data.value?.sessions?.reverse() ?? []"
          :key="session.id"
        >
          <v-list-item-title>{{ session.deviceName }}</v-list-item-title>
          <v-list-item-subtitle>{{ dayjs(session.createdAt).format('LLL') }}{{ session.lastKeepalive ? ' - ' + dayjs(session.lastKeepalive).format('LLL') : '' }}</v-list-item-subtitle>
          <template #append>
            <confirm-menu
              yes-color="warning"
              :title="$t('pages.me.deleteSession', session)"
              :alert="$t('pages.me.deleteSessionWarning', {duration: duration($uiConfig.jwtDurations.idToken * 1000).humanize()})"
              location="top end"
              @confirm="deleteSession(session.id)"
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
          </template>
        </v-list-item>
      </v-list>

      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          size="small"
          color="primary"
          style="top:-2px"
          :icon="mdiCog"
        />
        {{ $t('pages.me.settings') }}
      </h2>

      <template v-if="userDetailsFetch.data.value && (showIgnorePersonalAccount || defaultOrgItems.length > 1)">
        <h2 class="text-h5 mt-8 mb-4">
          {{ $t('pages.me.accountChanges') }}
        </h2>
        <v-checkbox
          v-if="showIgnorePersonalAccount"
          v-model="patch.ignorePersonalAccount"
          :label="$t('pages.me.ignorePersonalAccount')"
          :disabled="readonly"
          name="ignorePersonalAccount"
          @update:model-value="() => save()"
        />
        <v-select
          v-if="defaultOrgItems.length > 1"
          v-model="defaultOrg"
          :label="$t('pages.me.defaultOrg')"
          :disabled="readonly"
          name="defaultOrg"
          :items="defaultOrgItems"
          clearable
          variant="outlined"
          density="compact"
          @update:model-value="() => save()"
        />
      </template>

      <template v-if="$uiConfig.userSelfDelete && !readonly && userDetailsFetch.data.value">
        <h2 class="text-h5 mt-8 mb-4">
          {{ $t('pages.me.operations') }}
        </h2>
        <confirm-menu
          v-if="!userDetailsFetch.data.value.plannedDeletion"
          :button-text="$t('pages.me.deleteMyself', {name: user.name})"
          :title="$t('pages.me.deleteMyself', {name: user.name})"
          :alert="$t('pages.me.deleteMyselfAlert', {plannedDeletionDelay: $uiConfig.plannedDeletionDelay})"
          :check-text="$t('pages.me.deleteMyselfCheck', {name: user.name})"
          yes-color="warning"
          @confirm="deleteMyself"
        />
        <cancel-deletion
          v-else
          @cancelled="userDetailsFetch.refresh()"
        />
      </template>
    </v-form>
  </v-container>
</template>

<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { VForm } from 'vuetify/components'

const { user, keepalive } = useSession()
const { dayjs, duration } = useLocaleDayjs()
const { t } = useI18n()
const { userDetailsFetch, authProvidersFetch } = useStore()

if (!user.value) throw new Error('auth required')

userDetailsFetch.refresh()
authProvidersFetch.refresh()
const userOrgsFetch = useFetch<{ count: number }>($apiPath + '/organizations', { query: { creator: user.value?.id, size: 0 } })

const newPatch = () => ({
  firstName: userDetailsFetch.data.value?.firstName,
  lastName: userDetailsFetch.data.value?.lastName,
  birthday: userDetailsFetch.data.value?.birthday,
  ignorePersonalAccount: userDetailsFetch.data.value?.ignorePersonalAccount || false,
  defaultOrg: userDetailsFetch.data.value?.defaultOrg || '',
  defaultDep: userDetailsFetch.data.value?.defaultDep || ''
})
const patch = ref(newPatch())
watch(userDetailsFetch.data, () => { patch.value = newPatch() })

const birthdayMenu = ref(false)
const maxBirthday = dayjs().subtract(13, 'years').toISOString()
const activeBirthDayPicker = ref()
const setBirthDay = (birthday: Date) => {
  console.log('setBirthDay')
  patch.value.birthday = birthday.toISOString().slice(0, 10)
  birthdayMenu.value = false
  save()
}

const readonly = computed(() => $uiConfig.readonly || !!user.value?.os || !!user.value?.idp)
const nbCreatedOrgs = computed(() => userOrgsFetch.data.value?.count)
const maxCreatedOrgs = computed(() => {
  if (!userDetailsFetch.data.value) return 0
  return userDetailsFetch.data.value.maxCreatedOrgs !== undefined && userDetailsFetch.data.value.maxCreatedOrgs !== null ? userDetailsFetch.data.value.maxCreatedOrgs : $uiConfig.quotas.defaultMaxCreatedOrgs
})
const showMaxCreatedOrgs = computed(() => {
  if (!userDetailsFetch.data.value) return false
  if ($uiConfig.quotas.defaultMaxCreatedOrgs === -1) return false
  if ($uiConfig.quotas.defaultMaxCreatedOrgs === 0 && !userDetailsFetch.data.value.maxCreatedOrgs) return false
  return maxCreatedOrgs.value === -1 ? 'illimité' : ('' + maxCreatedOrgs.value)
})

const defaultOrgItems = computed<{ value: string, title: string }[]>(() => {
  return (patch.value.ignorePersonalAccount ? [] : [{ value: '', title: t('common.userAccount') }])
    .concat((userDetailsFetch.data.value?.organizations ?? []).map(o => ({
      value: o.id + (o.department ? (':' + o.department) : ''),
      title: o.name + (o.department ? (':' + (o.departmentName ?? o.department)) : '')
    })))
})
const showIgnorePersonalAccount = computed(() => {
// invitation mode only (means user should always be in an orga)
  // ignorePersonalAccount should already be true in this case
  if ($uiConfig.onlyCreateInvited && userDetailsFetch.data.value?.ignorePersonalAccount) return false
  // user only has a personal account
  // ignorePersonalAccount should already be false in this case
  if (user.value?.organizations.length === 0 && !userDetailsFetch.data.value?.ignorePersonalAccount) return false
  return true
})

const defaultOrg = computed<string>({
  get () {
    return patch.value.defaultOrg + (patch.value.defaultDep ? (':' + patch.value.defaultDep) : '')
  },
  set (value) {
    console.log('setDefaultOrg')
    if (value) {
      const [org, dep] = value.split(':')
      patch.value.defaultOrg = org
      patch.value.defaultDep = dep || ''
    } else {
      patch.value.defaultOrg = patch.value.defaultDep = ''
    }
  }
})

const userIdentities = computed(() => {
  if (!authProvidersFetch.data.value || !userDetailsFetch.data.value) return []
  return authProvidersFetch.data.value.map(p => ({
    ...p,
    user: (userDetailsFetch.data.value as any)?.[p.type]?.[p.id]
  })).filter(p => !!p.user).map(p => ({ ...p, name: p.user.login || p.user.name }))
})

watch(birthdayMenu, (val) => {
  if (val) setTimeout(() => { activeBirthDayPicker.value = 'YEAR' })
})

const form = ref<InstanceType<typeof VForm>>()
const save = withUiNotif(async (e?: Event) => {
  if (e?.preventDefault) e.preventDefault()
  await form.value?.validate()
  if (!form.value?.isValid) return
  if (!user.value) return
  await $fetch(`users/${user.value.id}`, { method: 'PATCH', body: patch.value })
  await keepalive()
  await userDetailsFetch.refresh()
}, undefined, t('common.modificationOk'))

const changePasswordAction = withUiNotif(async () => {
  if (!user.value) return
  let target = $sdUrl + '/login'
  try {
    target += '?redirect=' + encodeURIComponent(window.parent.location.href)
  } catch (err) {
    // no problem, we simply are not in an iframe context
  }
  await $fetch('auth/action', { method: 'POST', body: { email: user.value.email, action: 'changePassword', target } })
}, undefined, t('pages.login.changePasswordSent', { email: user.value?.email }))

const deleteMyself = withUiNotif(async () => {
  if (!user.value) return
  $fetch(`users/${user.value.id}`, { method: 'PATCH', body: { plannedDeletion: dayjs().add($uiConfig.plannedDeletionDelay, 'days').format('YYYY-MM-DD') } })
  await keepalive()
  await userDetailsFetch.refresh()
})

const deleteSession = withUiNotif(async (sessionId: string) => {
  if (!user.value) return
  try {
    $fetch(`users/${user.value.id}/sessions/${sessionId}`, { method: 'DELETE' })
  } catch (err) {
    if (err instanceof FetchError && err.statusCode === 401) {
      // a 401 is expected if we deleted the current session
    } else {
      throw err
    }
  }
  window.location.reload()
})
</script>

<style lang="css">
</style>
