<template>
  <v-row
    data-iframe-height
    class="mt-6 justify-space-around"
  >
    <v-col
      cols="12"
      style="max-width: 500px;"
    >
      <v-row class="justify-center mb-4">
        <v-col cols="auto">
          <logo style="height:100px" />
        </v-col>
      </v-row>
      <v-card
        class="pa-2"
        border="sm"
        rounded="xl"
        elevation="5"
      >
        <template v-if="errorCode">
          <v-card-title style="white-space: normal;">
            <h1 class="mb-0">
              {{ $t('pages.oauthConsent.errorTitle') }}
            </h1>
          </v-card-title>
          <v-card-text>
            <v-alert
              type="error"
              variant="tonal"
              data-error
            >
              {{ errorMessage }}
            </v-alert>
          </v-card-text>
        </template>

        <v-progress-linear
          v-else-if="loading"
          indeterminate
        />

        <template v-else-if="details">
          <v-card-title style="white-space: normal;">
            <div class="d-flex align-center">
              <img
                v-if="logoUri"
                :src="logoUri"
                referrerpolicy="no-referrer"
                :alt="details.client.name"
                style="max-width:48px;max-height:48px;"
                class="mr-3"
              >
              <h1 class="mb-0">
                {{ $t('pages.oauthConsent.title', { client: details.client.name }) }}
              </h1>
            </div>
          </v-card-title>
          <v-card-text>
            <template v-if="isDynamic">
              <v-alert
                type="warning"
                variant="tonal"
                class="mb-4"
                data-unverified
              >
                <div class="font-weight-bold">
                  {{ $t('pages.oauthConsent.unverifiedTitle') }}
                </div>
                {{ details.client.idUrl
                  ? $t('pages.oauthConsent.unverifiedCimd', { client: details.client.name, url: details.client.idUrl })
                  : $t('pages.oauthConsent.unverifiedDcr', { client: details.client.name }) }}
              </v-alert>
              <p
                class="text-body-large mb-4"
                data-resource
              >
                {{ details.resource.kind === 'mcp' ? $t('pages.oauthConsent.resourceMcp') : $t('pages.oauthConsent.resourceApi') }}
              </p>
              <consent-nhi
                v-model="nhiDecision"
                :details="details"
              />
            </template>
            <template v-else>
              <p class="text-body-large mb-2">
                {{ $t('pages.oauthConsent.willBeAble') }}
              </p>
              <consent-scopes
                v-model="selectedScopes"
                :scopes="details.scopes"
              />
              <consent-account
                v-model="account"
                :accounts="details.accounts!"
                class="mt-4"
              />
            </template>
            <v-alert
              v-if="rateLimited"
              type="warning"
              variant="tonal"
              class="mt-4"
              data-rate-limited
            >
              {{ $t('errors.rateLimitAuth') }}
            </v-alert>
            <p
              class="text-body-medium text-medium-emphasis mt-4 mb-0"
              data-redirect-host
            >
              {{ $t('pages.oauthConsent.redirectHost', { host: details.client.redirectHost }) }}
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              :disabled="decide.loading.value || redirecting"
              variant="text"
              @click="decide.execute('deny')"
            >
              {{ $t('pages.oauthConsent.deny') }}
            </v-btn>
            <v-btn
              :disabled="!canAllow || redirecting"
              :loading="decide.loading.value || redirecting"
              color="primary"
              variant="flat"
              @click="decide.execute('allow')"
            >
              {{ $t('pages.oauthConsent.allow') }}
            </v-btn>
          </v-card-actions>
        </template>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import type { NhiDecision } from '../../components/oauth/nhi-decision.ts'

type Account = { type: 'user' | 'organization', id: string, department?: string, departmentName?: string, name: string }
type Details = {
  client: { id: string, name: string, logoUri?: string, kind: string, verified: boolean, redirectHost: string, idUrl?: string, registeredAutomatically?: boolean },
  resource: { url: string, kind: 'api' | 'mcp' },
  scopes: { name: string, description: string, broad: boolean }[],
  oidcScopes: string[],
  accounts?: Account[],
  organizations: Account[],
  nhis: Record<string, { id: string, name: string, scopes?: string[] }[]>,
  lifetimes: string[],
  defaultLifetime: string
}

const { t } = useI18n()
const uid = useStringSearchParam('uid')
const queryError = useStringSearchParam('error')

const details = ref<Details>()
const loading = ref(false)
const loadError = ref<string>()
const selectedScopes = ref<string[]>([])
const account = ref<Account>()
const nhiDecision = ref<NhiDecision>()
const redirecting = ref(false)
const rateLimited = ref(false)

// logos of dynamic clients are attacker-controlled: https only
const logoUri = computed(() => /^https:\/\//i.test(details.value?.client.logoUri ?? '') ? details.value?.client.logoUri : undefined)

const isDynamic = computed(() => details.value?.client.kind === 'cimd' || details.value?.client.kind === 'dcr')
const canAllow = computed(() => isDynamic.value ? !!nhiDecision.value : !!selectedScopes.value.length && !!account.value)

const statusOf = (err: any) => err.status ?? err.statusCode ?? err.response?.status

// ?error= is anyone's text on an SD page: only an error code is shown, anything else gets the
// generic message with a fixed code
const safeQueryError = computed(() => {
  if (!queryError.value) return undefined
  return /^[a-z_]{1,64}$/.test(queryError.value) ? queryError.value : 'server_error'
})
const errorCode = computed(() => safeQueryError.value || loadError.value || (!uid.value ? 'interaction_expired' : undefined))
const errorMessage = computed(() => {
  const code = errorCode.value
  if (!code) return ''
  if (code === 'interaction_expired') return t('pages.oauthConsent.errors.interactionExpired')
  if (code === 'forbidden') return t('pages.oauthConsent.errors.forbidden')
  if (code === 'unauthorized') return t('pages.oauthConsent.errors.unauthorized')
  return t('pages.oauthConsent.errors.generic', { code })
})

const load = async () => {
  if (queryError.value || !uid.value) return
  loading.value = true
  try {
    details.value = await $fetch<Details>(`${$apiPath}/oauth/interaction/${encodeURIComponent(uid.value)}/details`)
    // nothing is preselected for a dynamic client: its identity is unverified
    if (!isDynamic.value) {
      selectedScopes.value = details.value.scopes.map(s => s.name)
      account.value = details.value.accounts![0]
    }
  } catch (err: any) {
    const status = statusOf(err)
    loadError.value = status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : status === 400 ? 'interaction_expired' : 'server_error'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const decide = useAsyncAction(async (decision: 'allow' | 'deny') => {
  const body: Record<string, any> = { decision }
  if (decision === 'allow' && isDynamic.value && nhiDecision.value) {
    Object.assign(body, nhiDecision.value)
  } else if (decision === 'allow' && account.value) {
    body.account = { type: account.value.type, id: account.value.id, department: account.value.department }
    body.scopes = selectedScopes.value
  }
  rateLimited.value = false
  try {
    const { redirectTo } = await $fetch<{ redirectTo: string }>(`${$apiPath}/oauth/interaction/${encodeURIComponent(uid.value!)}`, { method: 'POST', body })
    redirecting.value = true
    window.location.href = redirectTo
  } catch (err: any) {
    const status = statusOf(err)
    if (status === 429) rateLimited.value = true
    else loadError.value = status === 401 ? 'unauthorized' : status === 403 ? 'forbidden' : status === 400 ? 'interaction_expired' : 'server_error'
  }
})
</script>
