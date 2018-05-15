<template lang="html">
  <v-container>
    <h2 class="headline mb-3">{{ $t('common.myAccount') }}</h2>
    <v-form v-if="user" ref="form">
      <v-text-field
        :label="$t('common.email')"
        v-model="user.email"
        :disabled="true"
        name="email"
      />
      <v-text-field
        :label="$t('common.firstName')"
        v-model="patch.firstName"
        :disabled="!userDetails"
        name="firstName"
        @keyup.enter="save"
      />
      <v-text-field
        :label="$t('common.lastName')"
        v-model="patch.lastName"
        :disabled="!userDetails"
        name="lastName"
        @keyup.enter="save"
      />
      <v-layout row wrap>
        <v-spacer/>
        <v-btn color="primary" @click="save">{{ $t('common.save') }}</v-btn>
      </v-layout>
    </v-form>
  </v-container>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import eventBus from '../event-bus'

export default {
  data: () => ({
    patch: {firstName: null, lastName: null},
    rejectDialog: false
  }),
  computed: {
    ...mapState('session', ['user']),
    ...mapState(['userDetails'])
  },
  watch: {
    userDetails() {
      this.initPatch()
    }
  },
  mounted() {
    if (!this.user) this.$router.push(this.localePath('login'))
    if (this.userDetails) this.initPatch()
  },
  methods: {
    ...mapActions(['fetchUserDetails']),
    initPatch() {
      this.patch.firstName = this.userDetails.firstName
      this.patch.lastName = this.userDetails.lastName
    },
    async save() {
      if (!this.$refs.form.validate()) return
      try {
        await this.$axios.$patch(`api/users/${this.user.id}`, this.patch)
        eventBus.$emit('notification', this.$t('common.modificationOk'))
        this.fetchUserDetails()
      } catch (error) {
        eventBus.$emit('notification', {error})
      }
    }
  }
}
</script>

<style lang="css">
</style>
