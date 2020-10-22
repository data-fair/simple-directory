<template>
  <v-menu v-model="menu" :close-on-content-click="false" max-width="500px">
    <template v-slot:activator="{on}">
      <v-btn :title="$t('pages.organization.deleteMember')" flat icon color="warning" v-on="on">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title primary-title>
        {{ $t('pages.organization.confirmDeleteMemberTitle', {name: member.name}) }}
      </v-card-title>
      <v-card-text>
        {{ $t('pages.organization.confirmDeleteMemberMsg') }}
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn flat @click="menu = false">{{ $t('common.confirmCancel') }}</v-btn>
        <v-btn color="warning" @click="menu = false;$emit('delete', member)">{{ $t('common.confirmOk') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
export default {
  props: ['member'],
  data: () => ({ menu: false })
}
</script>

<style lang="css" scoped>
</style>
