<template>
  <div
    v-if="grants.length"
    data-connected-applications
  >
    <h2 class="text-headline-medium mt-10 mb-4">
      <v-icon
        size="small"
        color="primary"
        style="top:-2px"
        :icon="mdiApplicationCog"
      />
      {{ $t('pages.me.connectedApplications') }}
    </h2>

    <v-list class="py-0 border-sm">
      <template
        v-for="(grant, i) of grants"
        :key="grant.id"
      >
        <v-list-item
          lines="three"
          :data-grant-id="grant.id"
        >
          <v-list-item-title>{{ grant.clientName }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ accountName(grant.account) }} - {{ $t('pages.me.applicationGrantedOn', { date: dayjs(grant.createdAt).format('LL') }) }}
            - {{ grant.lastUsedAt ? $t('pages.me.applicationLastUsed', { date: dayjs(grant.lastUsedAt).format('LL') }) : $t('pages.me.applicationNeverUsed') }}
            - {{ $t('pages.me.applicationExpires', { date: dayjs(grant.expiresAt).format('LL') }) }}
          </v-list-item-subtitle>
          <v-list-item-subtitle class="mt-1">
            <v-chip
              v-for="scope of grant.scope.split(' ').filter(Boolean)"
              :key="scope"
              size="x-small"
              class="mr-1"
              label
            >
              {{ scope }}
            </v-chip>
          </v-list-item-subtitle>
          <template #append>
            <confirm-menu
              yes-color="warning"
              :title="$t('pages.me.revokeApplicationTitle', { name: grant.clientName })"
              :alert="$t('pages.me.revokeApplicationWarning', { duration: duration($uiConfig.jwtDurations.idToken * 1000).humanize() })"
              location="top end"
              @confirm="revoke.execute(grant.id)"
            >
              <template #activator="{props}">
                <v-btn
                  :title="$t('pages.me.revokeApplication')"
                  :aria-label="$t('pages.me.revokeApplication')"
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
        <v-divider v-if="i < grants.length - 1" />
      </template>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { mdiApplicationCog, mdiDelete } from '@mdi/js'

type Grant = {
  id: string,
  clientName: string,
  account: { type: 'user' | 'organization', id: string, department?: string },
  scope: string,
  createdAt: string,
  expiresAt: string,
  lastUsedAt?: string
}

const { user } = useSession()
const { dayjs, duration } = useLocaleDayjs()
const { t } = useI18n()

const grantsFetch = useFetch<{ results: Grant[] }>(() => `${$apiPath}/users/${user.value?.id}/oauth-grants`)
const grants = computed(() => grantsFetch.data.value?.results ?? [])

const accountName = (account: Grant['account']) => {
  if (account.type === 'user') return t('pages.me.applicationPersonalAccount')
  return user.value?.organizations.find(o => o.id === account.id)?.name ?? account.id
}

const revoke = useAsyncAction(async (grantId: string) => {
  await $fetch(`users/${user.value?.id}/oauth-grants/${grantId}`, { method: 'DELETE' })
  await grantsFetch.refresh()
})
</script>
