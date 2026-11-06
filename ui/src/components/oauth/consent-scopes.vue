<template>
  <v-list
    density="compact"
    class="py-0"
    data-consent-scopes
  >
    <v-list-item
      v-for="scope of scopes"
      :key="scope.name"
      :data-scope="scope.name"
      class="px-0"
    >
      <template #prepend>
        <v-icon
          :icon="scope.broad ? mdiShieldAlert : mdiCheck"
          :color="scope.broad ? 'warning' : 'success'"
          size="small"
          :title="scope.broad ? $t('pages.oauthConsent.broadScope') : undefined"
        />
      </template>
      <v-list-item-title style="white-space:normal;">
        {{ scope.description }}
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script lang="ts" setup>
import type { ConsentScope } from './nhi-decision.ts'

// read only: a grant carries the scopes of the request within the client registration or the
// scopes of the NHI, the user consents to them as a whole
defineProps<{ scopes: ConsentScope[] }>()
</script>
