<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-row class="mt-3 mx-0">
      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          large
          color="primary"
          style="top:-2px"
        >
          mdi-graph
        </v-icon>
        {{ orga.partnerLabel || $t('common.partners') }} <span>({{ $n(orga.partners.length) }})</span>
        <add-partner-menu
          v-if="writablePartners"
          :orga="orga"
          :partner-label="partnerLabel"
          @change="$emit('change')"
        />
        <!--<edit-partners-menu
          v-if="writablePartners"
          :orga="orga"
          :is-admin-orga="isAdminOrga"
          :partner-label="partnerLabel"
          @change="$emit('change')"
        />-->
      </h2>
    </v-row>

    <v-row
      v-if="orga.partners.length > pageSize"
      dense
    >
      <v-col cols="4">
        <v-text-field
          v-model="q"
          :label="$t('common.search')"
          name="search"
          solo
          append-icon="mdi-magnify"
          clearable
          @click:clear="$nextTick(() => $nextTick(() => filterPartners()))"
          @click:append="filterPartners"
          @keyup.enter="filterPartners"
        />
      </v-col>
    </v-row>

    <v-list
      v-if="orga.partners.length"
      two-line
      class="elevation-1 mt-1"
    >
      <template v-for="(partner, i) in currentPage">
        <v-list-item :key="partner.partnerId">
          <v-list-item-avatar>
            <v-img
              v-if="partner.id"
              :src="`${env.publicUrl}/api/avatars/organization/${partner.id}/avatar.png`"
            />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              {{ partner.name }} ({{ partner.contactEmail }})
              <template v-if="!partner.id">
                <span class="warning--text">{{ $t('common.emailNotConfirmed') }}
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
          </v-list-item-content>
          <v-list-item-action
            v-if="writablePartners"
            class="ml-0"
          >
            <delete-partner-menu
              :orga="orga"
              :partner="partner"
              :partner-label="partnerLabel"
              @change="$emit('change')"
            />
          </v-list-item-action>
        </v-list-item>
        <v-divider
          v-if="i + 1 < currentPage.length"
          :key="i"
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
      />
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from 'vuex'
import AddPartnerMenu from '~/components/add-partner-menu.vue'
import DeletePartnerMenu from '~/components/delete-partner-menu.vue'

export default {
  components: { AddPartnerMenu, DeletePartnerMenu },
  props: {
    isAdminOrga: {
      type: Boolean,
      default: null
    },
    orga: {
      type: Object,
      default: null
    }
  },
  data: () => ({
    pageSize: 10,
    page: 1,
    q: '',
    validQ: ''
  }),
  computed: {
    ...mapState(['userDetails', 'env']),
    writablePartners () {
      return this.isAdminOrga && (!this.env.readonly || this.env.overwrite.includes('partners'))
    },
    partnerLabel () {
      return this.orga.partnerLabel || this.$t('common.partner')
    },
    filteredPartners () {
      if (!this.validQ) return this.orga.partners
      else return this.orga.partners.filter(d => (d.id && d.id.includes(this.validQ)) || (d.id && d.id.includes(this.validQ)))
    },
    currentPage () {
      return this.filteredPartners.slice((this.page - 1) * this.pageSize, this.page * this.pageSize)
    }
  },
  created () {
    // eslint-disable-next-line vue/no-mutating-props
    this.orga.partners = this.orga.partners || []
  },
  methods: {
    filterPartners (page) {
      this.page = 1
      this.validQ = this.q
    }
  }
}
</script>

<style lang="css" scoped>
</style>
