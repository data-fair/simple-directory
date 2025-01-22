<template lang="html">
  <v-container
    fluid
    data-iframe-height
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h6 mb-3">
        {{ $t('common.oauthTokens') }} <span v-if="oauthTokens.data.value">({{ $n(oauthTokens.data.value?.count) }})</span>
      </h2>
    </v-row>

    <v-data-table
      v-if="oauthTokens"
      :headers="headers"
      :items="oauthTokens.data.value?.results"
      :loading="oauthTokens.loading.value"
      class="elevation-1"
      item-key="id"
      hide-default-footer
      :items-per-page="10000"
    >
      <template #item="props">
        <tr>
          <td>
            {{ JSON.stringify(props.item) }}
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup lang="ts">

const oauthTokens = useFetch<{ count: number, results: any[] }>($apiPath + '/oauth-tokens')

const headers = [
  { text: '', value: 'json', sortable: false }
]

</script>

<style lang="css">
</style>
