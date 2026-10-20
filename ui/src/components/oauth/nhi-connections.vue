<template>
  <div
    v-if="clients.length"
    data-nhi-connections
  >
    <v-list-item-subtitle
      class="mt-1"
      style="white-space:normal;"
    >
      {{ $t('pages.organization.nhiConnections') }}
    </v-list-item-subtitle>
    <div
      v-for="client of clients"
      :key="client.clientId"
      class="d-flex align-center"
      :data-client-id="client.clientId"
    >
      <!-- the name of a dynamic client is chosen by whoever registered it: text only -->
      <span class="text-body-2">
        <strong>{{ client.name }}</strong>
        - {{ $t('pages.organization.nhiConnectionsCount', { count: client.count }) }}
        - {{ client.lastUsedAt ? $t('pages.organization.nhiConnectionLastUsed', { date: dayjs(client.lastUsedAt).format('LL') }) : $t('pages.organization.nhiConnectionNeverUsed') }}
        - {{ $t('pages.organization.nhiConnectionExpires', { date: dayjs(client.expiresAt).format('LL') }) }}
        - {{ client.scopes.join(' ') }}
      </span>
      <confirm-menu
        yes-color="warning"
        :title="$t('pages.organization.revokeNhiConnectionsTitle', { name: client.name })"
        :alert="$t('pages.organization.revokeNhiConnectionsWarning', { duration: duration($uiConfig.jwtDurations.nhiToken * 1000).humanize() })"
        location="top end"
        @confirm="revoke.execute(client.clientId)"
      >
        <template #activator="{props}">
          <v-btn
            :title="$t('pages.organization.revokeNhiConnections')"
            :aria-label="$t('pages.organization.revokeNhiConnections')"
            v-bind="props"
            variant="text"
            density="compact"
            icon
            color="warning"
          >
            <v-icon :icon="mdiDelete" />
          </v-btn>
        </template>
      </confirm-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { mdiDelete } from '@mdi/js'

type Grant = {
  id: string,
  clientId: string,
  clientName: string,
  scope: string,
  createdAt: string,
  expiresAt: string,
  lastUsedAt?: string
}

const { orgId, nhiId } = defineProps({
  orgId: { type: String, required: true },
  nhiId: { type: String, required: true }
})
const { dayjs, duration } = useLocaleDayjs()

const base = `organizations/${orgId}/nhis/${nhiId}/oauth-grants`
const grantsFetch = useFetch<{ results: Grant[] }>(`${$apiPath}/${base}`)

// the connections of one client, as one line
const clients = computed(() => {
  const byClient = new Map<string, { clientId: string, name: string, count: number, lastUsedAt?: string, expiresAt: string, scopes: string[] }>()
  for (const g of grantsFetch.data.value?.results ?? []) {
    const c = byClient.get(g.clientId) ?? { clientId: g.clientId, name: g.clientName, count: 0, expiresAt: g.expiresAt, scopes: [] }
    c.count++
    if (g.lastUsedAt && (!c.lastUsedAt || g.lastUsedAt > c.lastUsedAt)) c.lastUsedAt = g.lastUsedAt
    if (g.expiresAt > c.expiresAt) c.expiresAt = g.expiresAt
    for (const scope of g.scope.split(' ').filter(Boolean)) if (!c.scopes.includes(scope)) c.scopes.push(scope)
    byClient.set(g.clientId, c)
  }
  return [...byClient.values()]
})

const revoke = useAsyncAction(async (clientId: string) => {
  await $fetch(base, { method: 'DELETE', params: { clientId } })
  await grantsFetch.refresh()
})
</script>
