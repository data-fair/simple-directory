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

      <load-avatar v-if="userDetails" :owner="{...userDetails, type: 'user'}" />

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
      <v-layout row>
        <v-menu
          v-model="birthdayMenu"
          :close-on-content-click="false"
          :nudge-right="40"
          transition="scale-transition"
          offset-y
          full-width
          max-width="290px"
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="patch.birthday"
              :label="$t('common.birthday')"
              prepend-icon="mdi-calendar"
              readonly
              clearable
              v-on="on"
            />
          </template>
          <v-date-picker v-model="patch.birthday" :max="maxBirthday" :picker-date="patch.birthday || maxBirthday" no-title @input="birthdayMenu = false"/>
        </v-menu>
      </v-layout>

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
      <v-layout v-if="!env.readonly" row>
        <p><a :title="$t('pages.login.changePasswordTooltip')" @click="changePasswordAction">{{ $t('pages.login.changePassword') }}</a></p>
      </v-layout>

      <v-layout v-if="userDetails && userDetails.oauth && Object.keys(userDetails.oauth).length" row>
        <v-btn v-for="oauth of env.oauth.filter(oauth => !!userDetails.oauth[oauth.id])" :key="oauth.id" :color="oauth.color" :href="userDetails.oauth[oauth.id].url" dark small round depressed class="pl-1 text-none pr-3">
          <v-icon>{{ oauth.icon }}</v-icon>
          &nbsp;&nbsp;{{ oauth.title }} - {{ userDetails.oauth[oauth.id].login || userDetails.oauth[oauth.id].name }}
        </v-btn>
      </v-layout>

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
import LoadAvatar from '../components/load-avatar.vue'
const moment = require('moment')

export default {
  components: {
    LoadAvatar
  },
  data: () => ({
    patch: { firstName: null, lastName: null, birthday: null },
    rejectDialog: false,
    nbCreatedOrgs: null,
    birthdayMenu: false,
    maxBirthday: moment().subtract(13, 'years').toISOString()
  }),
  computed: {
    ...mapState('session', ['user', 'initialized']),
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
    },
    initialized: {
      async handler() {
        if (!this.initialized) return
        if (!this.user) this.$router.push(this.localePath('login'))
        if (this.userDetails) this.initPatch()
        this.nbCreatedOrgs = (await this.$axios.$get(`api/organizations`, { params: { creator: this.user.id, size: 0 } })).count
      },
      immediate: true
    }
  },
  methods: {
    ...mapActions(['fetchUserDetails']),
    initPatch() {
      this.patch.firstName = this.userDetails.firstName
      this.patch.lastName = this.userDetails.lastName
      this.patch.birthday = this.userDetails.birthday
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
    },
    async changePasswordAction() {
      try {
        await this.$axios.$post('api/auth/action', { email: this.user.email, action: 'changePassword', target: this.env.publicUrl + '/login' })
        eventBus.$emit('notification', this.$t('pages.login.changePasswordSent', { email: this.user.email }))
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    }
  }
}
</script>

<style lang="css">
</style>
