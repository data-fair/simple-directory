<template lang="html">
  <v-container>
    <h2 class="headline mb-3">{{ $t('common.createOrganization') }}</h2>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field
        :label="$t('common.name')"
        v-model="newOrga.name"
        :rules="[v => !!v || '']"
        name="name"
        required
      />
      <v-textarea
        :label="$t('common.description')"
        v-model="newOrga.description"
        name="description"
        outline
      />
      <v-checkbox v-if="user && user.adminMode" :label="$t('common.autoAdmin')" v-model="autoAdmin" name="member" />
      <v-layout row>
        <v-spacer/>
        <v-btn :disabled="!valid" color="primary" @click="create">{{ $t('common.save') }}</v-btn>
      </v-layout>
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
    async create() {
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
