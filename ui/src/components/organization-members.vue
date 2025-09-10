<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          size="small"
          color="primary"
          style="top:-2px"
          :icon="mdiAccount"
        />
        {{ orgStorage === 'true' ? $t('common.orgStorageMembers') : $t('common.members') }} <span v-if="members">({{ $n(members.count) }})</span>
        <add-member-menu
          v-if="!$uiConfig.readonly"
          :orga="orga"
          :is-admin-orga="isAdminOrga"
          :members="members"
          :disable-invite="disableInvite"
          :department="adminDepartment"
          @sent="fetchMembers.refresh()"
        />
        <notify-menu
          v-if="isAdminOrga && orgStorage !== 'true'"
          :sender="`organization:${orga.id}:${department || ''}:admin`"
          :topics="notifyTopics"
        />
        <v-btn
          icon
          color="primary"
          class="mx-2"
          size="small"
          :href="csvUrl"
          :title="$t('common.downloadCsv')"
        >
          <v-icon :icon="mdiFileTable" />
        </v-btn>
      </h2>
    </v-row>

    <v-row
      v-if="members?.fromCache"
      class="mb-3 mx-0"
    >
      {{ t('pages.organization.fromCache', { fromNow: dayjs(members?.fromCache).fromNow() }) }}
    </v-row>

    <v-row dense>
      <v-col :cols="filterMemberCols">
        <v-text-field
          v-model="q"
          :label="$t('common.search')"
          name="search"
          variant="solo"
          density="comfortable"
          :append-inner-icon="mdiMagnify"
          clearable
          hide-details="auto"
          @click:clear="$nextTick(() => $nextTick(() => refetchMembers()))"
          @click:append-inner="refetchMembers()"
          @keyup.enter="refetchMembers()"
        />
      </v-col>
      <v-col :cols="filterMemberCols">
        <v-select
          v-model="role"
          :items="orga.roles"
          :label="$t('common.role')"
          name="role"
          variant="solo"
          density="comfortable"
          clearable
          hide-details="auto"
          @update:model-value="refetchMembers()"
        />
      </v-col>
      <v-col :cols="filterMemberCols">
        <v-autocomplete
          v-if="$uiConfig.manageDepartments && orga.departments && orga.departments.length && !adminDepartment"
          v-model="department"
          :items="[{id: '-', name: 'aucun'}].concat(orga.departments)"
          :label="orga.departmentLabel || $t('common.department')"
          item-value="id"
          item-title="name"
          clearable
          name="department"
          variant="solo"
          density="comfortable"
          hide-details="auto"
          @update:model-value="refetchMembers()"
        />
      </v-col>
      <v-col
        v-if="$uiConfig.alwaysAcceptInvitation"
        :cols="filterMemberCols"
      >
        <v-select
          v-model="emailConfirmedFilter"
          :items="[{id: 'true', name: $t('common.emailConfirmed')}, {id: 'false', name: $t('common.emailNotConfirmed')}]"
          :label="$t('common.creationStep')"
          item-value="id"
          item-title="name"
          clearable
          name="storage"
          variant="solo"
          density="comfortable"
          @update:model-value="refetchMembers()"
        />
      </v-col>
    </v-row>

    <v-list
      v-if="members && members.count"
      class="py-0 mt-1 border-sm"
    >
      <template
        v-for="(member, i) in members.results"
        :key="`${member.id}-${member.department}`"
      >
        <v-list-item

          :class="{'secondary-member': members.results[i-1] && members.results[i-1].id === member.id}"
        >
          <template #prepend>
            <v-avatar v-if="!members.results[i-1] || members.results[i-1].id !== member.id">
              <v-img
                :src="`${$sdUrl}/api/avatars/user/${member.id}/avatar.png`"
              />
            </v-avatar>
            <div
              v-else
              style="width:56px;"
            />
          </template>

          <template v-if="!members.results[i-1] || members.results[i-1].id !== member.id">
            <v-list-item-title style="white-space:normal;">
              {{ member.name }} ({{ member.email }})
              <template v-if="member.emailConfirmed === false">
                <span class="text-warning">{{ $t('common.emailNotConfirmed') }}
                  <resend-invitation
                    :member="member"
                    :orga="orga"
                    :department="adminDepartment"
                  />
                </span>
              </template>
            </v-list-item-title>
            <v-list-item-subtitle
              v-if="member.host"
              style="white-space:normal;"
            >
              {{ $t('common.host') }} = {{ member.host }}
            </v-list-item-subtitle>
            <v-list-item-subtitle
              v-if="member.plannedDeletion"
              style="white-space:normal;"
            >
              {{ $t('common.plannedDeletion') }} = {{ $d(new Date(member.plannedDeletion)) }}
            </v-list-item-subtitle>
          </template>
          <v-list-item-subtitle style="white-space:normal;">
            <span v-if="member.department">{{ orga.departmentLabel || $t('common.department') }} = {{ member.departmentName || member.department }}, </span>
            <span>{{ $t('common.role') }} = {{ member.role }}</span>
          </v-list-item-subtitle>

          <template #append>
            <v-list-item-action v-if="isAdminOrga && (!readonly || $uiConfig.orgStorageOverwrite?.includes('members'))">
              <edit-member-menu
                :orga="orga"
                :member="member"
                :department="adminDepartment"
                @save="(newMember: Member) => saveMember.execute(newMember, member)"
              />
            </v-list-item-action>
            <v-list-item-action
              v-if="user.adminMode && !member.orgStorage && $uiConfig.asAdmin"
              class="ml-2"
            >
              <v-btn
                :title="$t('common.asAdmin')"
                :icon="mdiAccountSwitch"
                color="warning"
                variant="text"
                density="compact"
                :disabled="!member.emailConfirmed"
                @click="asAdmin(member)"
              />
            </v-list-item-action>
            <v-list-item-action
              v-if="isAdminOrga && !readonly"
              class="ml-2"
            >
              <delete-member-menu
                :member="member"
                :orga="orga"
                :disabled="deleteMember.loading.value"
                @delete="deleteMember.execute(member)"
              />
            </v-list-item-action>
          </template>
        </v-list-item>
        <v-divider
          v-if="members.results[i+1] && members.results[i+1].id !== member.id"
        />
      </template>
    </v-list>

    <v-row
      v-if="members && members.count > membersPageSize"
      class="mt-2"
    >
      <v-spacer />
      <v-pagination
        :model-value="membersPage"
        :length="Math.ceil(members.count / membersPageSize)"
        total-visible="4"
        @update:model-value="page => {membersPage = page}"
      />
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { QueryObject } from 'ufo'
const { dayjs } = useLocaleDayjs()

const { isAdminOrga, orga, nbMembersLimits, orgStorage, readonly, adminDepartment } = defineProps({
  isAdminOrga: {
    type: Boolean,
    default: null
  },
  orga: {
    type: Object as () => Organization,
    required: true
  },
  nbMembersLimits: {
    type: Object,
    default: null
  },
  orgStorage: {
    type: String,
    default: 'both'
  },
  readonly: {
    type: Boolean,
    default: false
  },
  adminDepartment: {
    type: String,
    default: null
  }
})

const { t } = useI18n()
const { sendUiNotif } = useUiNotif()
const { user, asAdmin } = useSessionAuthenticated()

const q = ref('')
const role = ref()
const department = ref(adminDepartment)
const membersPage = ref(1)
const membersPageSize = 10
const emailConfirmedFilter = ref<boolean | null>(null)

const disableInvite = computed(() => !nbMembersLimits || (nbMembersLimits.limit > 0 && nbMembersLimits.consumption >= nbMembersLimits.limit))

const notifyTopics = computed(() => {
  if ($uiConfig.alwaysAcceptInvitation) {
    return [{ key: 'simple-directory:add-member', title: t('notifications.addMemberTopic') }]
  } else {
    return [
      { key: 'simple-directory:invitation-sent', title: t('notifications.sentInvitationTopic') },
      { key: 'simple-directory:invitation-accepted', title: t('notifications.acceptedInvitationTopic') }
    ]
  }
})

const csvUrl = computed(() => $sdUrl + `/api/organizations/${orga.id}/members?size=10000&format=csv`)
const filterMemberCols = $uiConfig.alwaysAcceptInvitation ? 6 : 4

const membersParams = computed(() => {
  const params: QueryObject = {
    page: membersPage.value,
    size: membersPageSize,
    role: role.value,
    org_storage: orgStorage,
    sort: 'name'
  }
  if (department.value) params.department = department.value
  if (q.value) params.q = q.value
  if (emailConfirmedFilter.value !== null) {
    params.email_confirmed = emailConfirmedFilter
  }
  return params
})

const fetchMembers = useFetch<{ count: number, results: any[], fromCache?: string }>(() => `${$apiPath}/organizations/${orga.id}/members`, { query: membersParams })
const members = computed(() => fetchMembers.data.value)
const refetchMembers = async () => {
  membersPage.value = 1
}

const deleteMember = useAsyncAction(async (member: Member) => {
  const params: Record<string, string> = {}
  if (member.department) params.department = member.department
  if ($uiConfig.multiRoles) params.role = member.role
  await $fetch(`organizations/${orga.id}/members/${member.id}`, { method: 'DELETE', params })
  sendUiNotif({ type: 'success', msg: t('pages.organization.deleteMemberSuccess', { name: member.name }) })
  await fetchMembers.refresh()
  if (fetchMembers.data.value?.count && !fetchMembers.data.value.results.length && membersPage.value > 1) {
    membersPage.value -= 1
    await fetchMembers.refresh()
  }
})

const saveMember = useAsyncAction(async (member: Member, oldMember: Member) => {
  const patch: Partial<Member> = { role: member.role }
  if (member.department) {
    const dep = orga.departments?.find(d => d.id === member.department)
    if (dep) patch.department = dep.id
  }
  const params: Record<string, string> = {}
  if (oldMember.department) params.department = oldMember.department
  if ($uiConfig.multiRoles) params.role = oldMember.role
  await $fetch(`organizations/${orga.id}/members/${member.id}`, {
    method: 'PATCH',
    body: patch,
    params
  })
  fetchMembers.refresh()
})

</script>

<style lang="css" scoped>
.v-list .v-list-item.secondary-member {
  min-height: 36px;
  height: 36px;
}
.v-list .v-list-item.secondary-member .v-list-item__action {
  margin-top: 0;
  margin-bottom: 0;
}
</style>
