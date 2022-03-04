<template lang="html">
  <v-container data-iframe-height>
    <h2 class="text-h5 mb-3">
      {{ $t('common.createOrganization') }}
    </h2>
    <v-form
      ref="form"
      v-model="valid"
      lazy-validation
    >
      <v-text-field
        v-model="newOrga.name"
        :label="$t('common.name')"
        :rules="[v => !!v || '']"
        name="name"
        required
      />
      <v-textarea
        v-model="newOrga.description"
        :label="$t('common.description')"
        name="description"
        outlines
      />
      <v-checkbox
        v-if="user && user.adminMode"
        v-model="autoAdmin"
        :label="$t('common.autoAdmin')"
        name="member"
      />
      <v-row>
        <v-spacer />
        <v-btn
          :disabled="!valid"
          color="primary"
          @click="create"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import eventBus from '../event-bus'
export default {
  data: () => ({
    valid: true,
    newOrga: { name: '', description: '' },
    autoAdmin: true
  }),
  computed: {
    ...mapState('session', ['user'])
  },
  methods: {
    ...mapActions(['fetchUserDetails']),
    async create () {
      if (!this.$refs.form.validate()) return
      try {
        const res = await this.$axios.$post('api/organizations', this.newOrga, { params: { autoAdmin: this.autoAdmin } })
        this.fetchUserDetails()
        this.$router.push(this.localePath({ name: 'organization-id', params: { id: res.id } }))
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style lang="css">
</style>
