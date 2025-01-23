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
          :icon="mdiGraph"
        />
        {{ $t('common.partners') }} <span>({{ $n(orga.partners?.length ?? 0) }})</span>
        <add-partner-menu
          v-if="writablePartners"
          :orga="orga"
          @change="$emit('change')"
        />
        <!--<edit-partners-menu
          v-if="writablePartners"
          :orga="orga"
          :is-admin-orga="isAdminOrga"
          @change="$emit('change')"
        />-->
      </h2>
    </v-row>

    <v-row
      v-if="(orga.partners?.length ?? 0) > pageSize"
      dense
    >
      <v-col cols="4">
        <v-text-field
          v-model="q"
          :label="$t('common.search')"
          name="search"
          variant="solo"
          density="comfortable"
          :append-inner-icon="mdiMagnify"
          clearable
          @click:clear="$nextTick(() => $nextTick(() => filterPartners()))"
          @click:append-inner="filterPartners"
          @keyup.enter="filterPartners"
        />
      </v-col>
    </v-row>

    <v-list
      v-if="orga.partners?.length"
      lines="two"
      class="py-0 mt-1 border-sm"
    >
      <template
        v-for="(partner, i) in currentPage"
        :key="partner.partnerId"
      >
        <v-list-item>
          <template #prepend>
            <v-avatar>
              <v-img
                v-if="partner.id"
                :src="`${$sdUrl}/api/avatars/organization/${partner.id}/avatar.png`"
              />
            </v-avatar>
          </template>

          <v-list-item-title style="white-space:normal;">
            {{ partner.name }} ({{ partner.contactEmail }})
            <template v-if="!partner.id">
              <span class="text-warning">{{ $t('common.emailNotConfirmed') }}
                <resend-partner-invitation
                  :partner="partner"
                  :orga="orga"
                />
              </span>
            </template>
          </v-list-item-title>
          <v-list-item-subtitle v-if="partner.createdAt">
            {{ $t('common.createdAt') }} {{ $d(new Date(partner.createdAt)) }}
          </v-list-item-subtitle>

          <template #append>
            <v-list-item-action
              v-if="writablePartners"
              class="ml-0"
            >
              <delete-partner-menu
                :orga="orga"
                :partner="partner"
                @change="$emit('change')"
              />
            </v-list-item-action>
          </template>
        </v-list-item>
        <v-divider
          v-if="currentPage && currentPage.length > i + 1"
        />
      </template>
    </v-list>

    <v-row
      v-if="orga.partners && filteredPartners.length > pageSize"
      class="mt-2"
    >
      <v-spacer />
      <v-pagination
        v-model="page"
        :length="Math.ceil(filteredPartners.length / pageSize)"
        total-visible="4"
      />
    </v-row>
  </v-container>
</template>

<script setup lang="ts">

const { isAdminOrga, orga } = defineProps({
  isAdminOrga: {
    type: Boolean,
    default: null
  },
  orga: {
    type: Object as () => Organization,
    default: null
  }
})
defineEmits(['change'])

const pageSize = 10
const page = ref(1)
const q = ref('')
const validQ = ref('')

const writablePartners = computed(() => isAdminOrga && (!$uiConfig.readonly || $uiConfig.orgStorageOverwrite?.includes('partners')))
const filteredPartners = computed(() => {
  if (!validQ.value) return orga.partners ?? []
  else return (orga.partners ?? []).filter(d => (d.id && d.id.includes(validQ.value)) || (d.id && d.id.includes(validQ.value)))
})
const currentPage = computed(() => filteredPartners.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const filterPartners = () => {
  page.value = 1
  validQ.value = q.value
}
</script>

<style lang="css" scoped>
</style>
