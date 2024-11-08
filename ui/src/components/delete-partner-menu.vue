<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    
  >
    <template #activator="{props}">
      <v-btn
        :title="$t('pages.organization.deletePartner')"
        variant="text"
        icon
        color="warning"
        v-bind="props"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </template>

    <v-card
      data-iframe-height
      width="500"
    >
      <v-card-title class="text-h6">
        {{ $t('common.confirmDeleteTitle', {name: partner.name}) }}
      </v-card-title>
      <v-card-text>
        <p>
          {{ $t('common.confirmDeleteMsg', {name: partner.name}) }}
        </p>
        <p>
          Attention les permissions accordées à l'organisation partenaire ne seront pas modifiées par cette opération. Vous devriez probablement aller les modifier vous même.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="menu = false"
        >
          {{ $t('common.confirmCancel') }}
        </v-btn>
        <v-btn
          color="warning"
          @click="confirmDelete"
        >
          {{ $t('common.confirmOk') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
export default {
  props: ['orga', 'partner'],
  data: () => ({ menu: false, members: null }),
  methods: {
    async confirmDelete () {
      this.menu = false
      await this.$axios.$delete(`api/organizations/${this.orga.id}/partners/${this.partner.partnerId}`)
      this.$emit('change')
    }
  }
}
</script>

<style lang="css" scoped>
</style>
