<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-headline-medium mt-10 mb-4">
        <v-icon
          size="small"
          color="primary"
          style="top:-2px"
          :icon="mdiRobot"
        />
        {{ $t('pages.organization.nhisTitle') }} <span v-if="nhis">({{ $n(nhis.count) }})</span>
        <add-nhi-menu
          v-if="isAdminOrga"
          :orga="orga"
          @change="fetchNhis.refresh()"
        />
        <v-tooltip location="right">
          <template #activator="{props}">
            <v-icon
              v-bind="props"
              size="small"
              color="info"
              class="ml-1"
              :icon="mdiInformation"
            />
          </template>
          {{ $t('pages.organization.nhisHelp') }}
        </v-tooltip>
      </h2>
    </v-row>

    <v-list
      v-if="nhis && nhis.count"
      lines="three"
      class="py-0 mt-1 border-sm"
    >
      <template
        v-for="(nhi, i) in nhis.results"
        :key="nhi.id"
      >
        <v-list-item>
          <v-list-item-title style="white-space:normal;">
            {{ nhi.name }}
          </v-list-item-title>
          <v-list-item-subtitle style="white-space:normal;">
            <span v-if="nhi.department">{{ orga.departmentLabel || $t('common.department') }} = {{ nhi.department }}, </span>
            <span>{{ $t('common.role') }} = {{ nhi.role }}</span>
          </v-list-item-subtitle>
          <v-list-item-subtitle style="white-space:normal;">
            {{ $t('pages.organization.nhiSubject') }} = {{ nhi.subject }}
          </v-list-item-subtitle>
          <v-list-item-subtitle style="white-space:normal;">
            {{ $t('pages.organization.nhiIssuer') }} = {{ nhi.provider?.issuer }}
          </v-list-item-subtitle>
          <v-list-item-subtitle style="white-space:normal;">
            {{ $t('pages.organization.nhiClientId') }} = {{ nhi.id }}
            <v-btn
              :title="$t('pages.organization.nhiClientId')"
              variant="text"
              density="compact"
              :icon="mdiContentCopy"
              @click="copy(nhi.id)"
            />
          </v-list-item-subtitle>

          <template #append>
            <v-list-item-action v-if="isAdminOrga">
              <edit-nhi-menu
                :orga="orga"
                :nhi="nhi"
                @change="fetchNhis.refresh()"
              />
            </v-list-item-action>
            <v-list-item-action
              v-if="isAdminOrga"
              class="ml-2"
            >
              <delete-nhi-menu
                :orga="orga"
                :nhi="nhi"
                @change="fetchNhis.refresh()"
              />
            </v-list-item-action>
          </template>
        </v-list-item>
        <v-divider
          v-if="nhis && nhis.results.length > i + 1"
        />
      </template>
    </v-list>
  </v-container>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const { isAdminOrga, orga } = defineProps({
  isAdminOrga: {
    type: Boolean,
    default: false
  },
  orga: {
    type: Object as () => Organization,
    required: true
  }
})

const { copy } = useClipboard()

const fetchNhis = useFetch<{ count: number, results: any[] }>(`${$apiPath}/organizations/${orga.id}/nhis`)
const nhis = computed(() => fetchNhis.data.value)
</script>

<style lang="css" scoped>
</style>
