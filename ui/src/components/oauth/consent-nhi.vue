<template>
  <div data-consent-nhi>
    <v-alert
      v-if="!details.organizations.length"
      type="warning"
      variant="tonal"
      data-no-organization
    >
      {{ $t('pages.oauthConsent.noOrganization') }}
    </v-alert>
    <template v-else>
      <consent-account
        v-model="account"
        :accounts="details.organizations"
      />

      <v-select
        v-model="nhiChoice"
        :items="nhiItems"
        :label="$t('pages.oauthConsent.nhi')"
        density="comfortable"
        variant="outlined"
        rounded
        hide-details
        class="mt-4"
        name="nhi"
      />

      <template v-if="nhiChoice === createKey">
        <v-text-field
          v-model="newName"
          :label="$t('pages.oauthConsent.nhiName')"
          density="comfortable"
          variant="outlined"
          class="mt-4"
          hide-details
          name="nhiName"
          autocomplete="off"
        />
        <v-select
          v-model="newRole"
          :items="roleItems"
          :label="$t('pages.oauthConsent.nhiRole')"
          density="comfortable"
          variant="outlined"
          class="mt-4"
          hide-details
          name="nhiRole"
        />
        <v-autocomplete
          v-model="newMaxScopes"
          :items="scopeItems"
          item-props
          :label="$t('pages.oauthConsent.nhiScopes')"
          :hint="$t('pages.oauthConsent.nhiScopesHint')"
          persistent-hint
          multiple
          chips
          closable-chips
          density="comfortable"
          variant="outlined"
          class="mt-4"
          name="nhiScopes"
        />
      </template>

      <p class="text-body-large mt-4 mb-2">
        {{ $t('pages.oauthConsent.permissions') }}
      </p>
      <consent-scopes
        v-model="selectedScopes"
        :scopes="availableScopes"
      />

      <v-select
        v-model="lifetime"
        :items="lifetimeItems"
        :label="$t('pages.oauthConsent.lifetime')"
        density="comfortable"
        variant="outlined"
        rounded
        hide-details
        class="mt-4"
        name="lifetime"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { NhiDecision } from './nhi-decision.ts'

type Account = { type: 'user' | 'organization', id: string, department?: string, departmentName?: string, name: string }

const props = defineProps<{
  details: {
    scopes: { name: string, description: string, broad: boolean }[],
    organizations: Account[],
    nhis: Record<string, { id: string, name: string, scopes?: string[] }[]>,
    lifetimes: string[],
    defaultLifetime: string
  }
}>()
// the complete decision, undefined while the choices are not valid yet
const decision = defineModel<NhiDecision | undefined>({ required: true })

const { t } = useI18n()
const { scopeItems } = usePlatformScopes()

const createKey = '__create__'
const account = ref<Account | undefined>(props.details.organizations[0])
const nhiChoice = ref<string>(createKey)
const newName = ref('')
const newRole = ref('')
const newMaxScopes = ref<string[]>([])
// nothing is preselected for a dynamic client
const selectedScopes = ref<string[]>([])
const lifetime = ref(props.details.defaultLifetime)

const orgNhis = computed(() => account.value ? props.details.nhis[account.value.id] ?? [] : [])
const nhiItems = computed(() => [
  ...orgNhis.value.map(n => ({ value: n.id, title: n.name })),
  { value: createKey, title: t('pages.oauthConsent.nhiCreate') }
])
const lifetimeItems = computed(() => props.details.lifetimes.map(value => ({ value, title: t(`pages.oauthConsent.lifetime${value}`) })))

// the roles are those of the chosen organization
const orga = ref<Organization>()
const { roleItems } = useRoleLabels(orga)
watch(() => account.value?.id, async (id) => {
  orga.value = undefined
  newRole.value = ''
  nhiChoice.value = createKey
  if (!id) return
  try {
    const fetched = await $fetch<Organization>(`organizations/${id}`)
    if (account.value?.id === id) orga.value = fetched
  } catch (err) {
    console.error(err)
  }
}, { immediate: true })

// the identity caps the permissions: an existing one by its scopes, a new one by the maximum entered
const maxScopes = computed(() => {
  if (nhiChoice.value === createKey) return newMaxScopes.value.length ? newMaxScopes.value : undefined
  return orgNhis.value.find(n => n.id === nhiChoice.value)?.scopes
})
const availableScopes = computed(() => maxScopes.value ? props.details.scopes.filter(s => maxScopes.value!.includes(s.name)) : props.details.scopes)
watch(availableScopes, (scopes) => {
  selectedScopes.value = selectedScopes.value.filter(s => scopes.some(a => a.name === s))
})

watchEffect(() => {
  const acc = account.value
  if (acc?.type !== 'organization' || !selectedScopes.value.length) {
    decision.value = undefined
    return
  }
  const base = {
    account: { type: 'organization' as const, id: acc.id, ...(acc.department ? { department: acc.department } : {}) },
    scopes: [...selectedScopes.value],
    lifetime: lifetime.value
  }
  if (nhiChoice.value === createKey) {
    if (!newName.value.trim() || !newRole.value) {
      decision.value = undefined
      return
    }
    // without an explicit maximum, the new identity gets exactly the permissions ticked
    decision.value = { ...base, nhi: { create: { name: newName.value.trim(), role: newRole.value, scopes: newMaxScopes.value.length ? [...newMaxScopes.value] : [...selectedScopes.value] } } }
  } else {
    decision.value = { ...base, nhi: { id: nhiChoice.value } }
  }
})
</script>
