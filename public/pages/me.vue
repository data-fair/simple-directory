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
      <div v-if="userDetails && userDetails.organizations.length">
        <span>{{ $t('common.organizations') }}:</span>
        <span v-for="orga in userDetails.organizations" :key="orga.id">
          {{ orga.name }} ({{ orga.role }})
          &nbsp;
        </span>
      </div>
      <br>
      <div v-if="showMaxCreatedOrgs">
        <p v-if="nbCreatedOrgs !== null">{{ $t('common.nbCreatedOrgs') + ' ' + nbCreatedOrgs }} </p>
        <p>{{ $t('common.maxCreatedOrgs') }} : {{ userDetails.maxCreatedOrgs !== undefined && userDetails.maxCreatedOrgs !== null ? userDetails.maxCreatedOrgs : env.defaultMaxCreatedOrgs }}</p>
      </div>
      <v-layout row wrap>
        <v-spacer/>
        <v-btn color="primary" @click="save">{{ $t('common.save') }}</v-btn>
      </v-layout>
    </v-form>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import eventBus from '../event-bus'

export default {
  data: () => ({
    patch: { firstName: null, lastName: null },
    rejectDialog: false,
    nbCreatedOrgs: null
  }),
  computed: {
    ...mapState('session', ['user']),
    ...mapState(['userDetails', 'env']),
    showMaxCreatedOrgs() {
      if (!this.userDetails) return false
      if (this.env.defaultMaxCreatedOrgs === -1) return false
      if (this.env.defaultMaxCreatedOrgs === 0 && !this.userDetails.maxCreatedOrgs) return false
      return true
    }
  },
  watch: {
    userDetails() {
      this.initPatch()
    }
  },
  async created() {
    if (!this.user) this.$router.push(this.localePath('login'))
    if (this.userDetails) this.initPatch()
    this.nbCreatedOrgs = (await this.$axios.$get(`api/organizations`, { params: { creator: this.user.id, size: 0 } })).count
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
        await this.$axios.$post(`api/session/keepalive`)
        eventBus.$emit('notification', this.$t('common.modificationOk'))
        this.fetchUserDetails()
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style lang="css">
</style>
