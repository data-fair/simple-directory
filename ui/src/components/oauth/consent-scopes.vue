<template>
  <div>
    <v-checkbox
      v-for="scope of scopes"
      :key="scope.name"
      v-model="selected"
      :value="scope.name"
      density="compact"
      hide-details
      :data-scope="scope.name"
    >
      <template #label>
        <span>{{ scope.description }}</span>
        <v-icon
          v-if="scope.broad"
          :icon="mdiShieldAlert"
          color="warning"
          size="small"
          class="ml-2"
          :title="$t('pages.oauthConsent.broadScope')"
        />
      </template>
    </v-checkbox>
    <p
      v-if="!selected.length"
      class="text-error text-body-small mt-2"
    >
      {{ $t('pages.oauthConsent.atLeastOneScope') }}
    </p>
  </div>
</template>

<script lang="ts" setup>
defineProps<{ scopes: { name: string, description: string, broad: boolean }[] }>()
const selected = defineModel<string[]>({ required: true })
</script>
