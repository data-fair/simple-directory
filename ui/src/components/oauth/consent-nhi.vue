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

      <v-alert
        v-if="!orgNhis.length"
        type="info"
        variant="tonal"
        class="mt-4"
        data-no-nhi
      >
        {{ $t('pages.oauthConsent.noNhi') }}
        <div class="mt-2">
          <router-link :to="nhisPage">
            {{ $t('pages.oauthConsent.manageNhis') }}
          </router-link>
        </div>
      </v-alert>
      <template v-else>
        <v-select
          v-model="nhiChoice"
          :items="nhiItems"
          :label="$t('pages.oauthConsent.nhi')"
          :hint="$t('pages.oauthConsent.nhiHint')"
          persistent-hint
          density="comfortable"
          variant="outlined"
          rounded
          class="mt-4"
          name="nhi"
        />

        <template v-if="chosenNhi">
          <p class="text-body-large mt-4 mb-2">
            {{ $t('pages.oauthConsent.permissions') }}
          </p>
          <consent-scopes :scopes="chosenNhi.scopes" />
        </template>

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
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { NhiDecision, ConsentScope } from './nhi-decision.ts'

type Account = { type: 'user' | 'organization', id: string, department?: string, departmentName?: string, name: string }

const props = defineProps<{
  details: {
    organizations: Account[],
    // per NHI, the scopes the grant would carry with it
    nhis: Record<string, { id: string, name: string, scopes: ConsentScope[] }[]>,
    lifetimes: string[],
    defaultLifetime: string
  }
}>()
// the complete decision, undefined while the choices are not valid yet
const decision = defineModel<NhiDecision | undefined>({ required: true })

const { t } = useI18n()

const account = ref<Account | undefined>(props.details.organizations[0])
// the service accounts are managed on the organization page, the consent only picks one
const nhiChoice = ref<string>()
const lifetime = ref(props.details.defaultLifetime)

const orgNhis = computed(() => account.value ? props.details.nhis[account.value.id] ?? [] : [])
const nhiItems = computed(() => orgNhis.value.map(n => ({ value: n.id, title: n.name })))
const nhisPage = computed(() => `/organization/${account.value?.id}#nhis`)
const lifetimeItems = computed(() => props.details.lifetimes.map(value => ({ value, title: t(`pages.oauthConsent.lifetime${value}`) })))
watch(() => account.value?.id, () => { nhiChoice.value = undefined })

// the identity sets the permissions: the requested scopes within its own, nothing to choose
const chosenNhi = computed(() => orgNhis.value.find(n => n.id === nhiChoice.value))

watchEffect(() => {
  const acc = account.value
  if (acc?.type !== 'organization' || !nhiChoice.value) {
    decision.value = undefined
    return
  }
  decision.value = {
    account: { type: 'organization' as const, id: acc.id, ...(acc.department ? { department: acc.department } : {}) },
    nhi: { id: nhiChoice.value },
    lifetime: lifetime.value
  }
})
</script>
