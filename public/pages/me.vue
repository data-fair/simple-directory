<template lang="html">
  <v-container>
    <h2 class="text-h5 mb-3">
      {{ $t('common.myAccount') }}
    </h2>
    <v-form
      v-if="user"
      ref="form"
      data-iframe-height
    >
      <v-text-field
        v-model="user.email"
        :label="$t('common.email')"
        :disabled="true"
        name="email"
      />

      <load-avatar
        v-if="userDetails"
        :owner="{...userDetails, type: 'user'}"
        :disabled="!userDetails || env.readonly"
      />

      <v-text-field
        v-model="patch.firstName"
        :label="$t('common.firstName')"
        :disabled="!userDetails || env.readonly"
        name="firstName"
        @keyup.enter="save"
      />
      <v-text-field
        v-model="patch.lastName"
        :label="$t('common.lastName')"
        :disabled="!userDetails || env.readonly"
        name="lastName"
        @keyup.enter="save"
      />
      <v-row v-if="!env.noBirthday" class="mx-0">
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
          <template #activator="{ on }">
            <v-text-field
              v-model="patch.birthday"
              :label="$t('common.birthday')"
              :disabled="!userDetails || env.readonly"
              prepend-icon="mdi-calendar"
              readonly
              clearable
              v-on="on"
            />
          </template>
          <v-date-picker
            v-model="patch.birthday"
            :max="maxBirthday"
            :picker-date="patch.birthday || maxBirthday"
            no-title
            @input="birthdayMenu = false"
          />
        </v-menu>
      </v-row>

      <v-row v-if="!env.readonly" class="mx-0">
        <p><a :title="$t('pages.login.changePasswordTooltip')" @click="changePasswordAction">{{ $t('pages.login.changePassword') }}</a></p>
      </v-row>

      <v-row v-if="userDetails && userDetails.oauth && Object.keys(userDetails.oauth).length" class="mx-0">
        <v-btn
          v-for="oauth of env.oauth.filter(oauth => !!userDetails.oauth[oauth.id])"
          :key="oauth.id"
          :color="oauth.color"
          :href="userDetails.oauth[oauth.id].url"
          dark
          small
          round
          depressed
          class="pl-1 text-none pr-3"
        >
          <v-icon>{{ oauth.icon }}</v-icon>
          &nbsp;&nbsp;{{ oauth.title }} - {{ userDetails.oauth[oauth.id].login || userDetails.oauth[oauth.id].name }}
        </v-btn>
      </v-row>

      <v-row v-if="!env.readonly" class="mx-0">
        <v-spacer />
        <v-btn color="primary" @click="save">
          {{ $t('common.save') }}
        </v-btn>
      </v-row>
      <br>

      <h2 class="text-h5 mb-3">
        {{ $t('common.myOrganizations') }}
      </h2>

      <div v-if="userDetails">
        <template v-if="userDetails.organizations.length">
          <span v-for="orga in userDetails.organizations" :key="orga.id">
            {{ orga.name }} ({{ orga.role }})
            &nbsp;
          </span>
        </template>
        <span v-else>
          {{ $t('pages.me.noOrganization') }}
        </span>
      </div>
      <br>
      <div v-if="showMaxCreatedOrgs">
        <p v-if="nbCreatedOrgs !== null">
          {{ $t('common.nbCreatedOrgs') + ' ' + nbCreatedOrgs }}
        </p>
        <p>{{ $t('common.maxCreatedOrgs') }} : {{ showMaxCreatedOrgs }}</p>
      </div>

      <add-organization-menu v-if="!env.readonly && (maxCreatedOrgs === -1 || maxCreatedOrgs > nbCreatedOrgs)" />

      <template v-if="env.userSelfDelete && !env.readonly">
        <h2 class="text-h5 mt-4 mb-3">
          {{ $t('pages.me.operations') }}
        </h2>
        <confirm-menu
          :button-text="$t('pages.me.deleteMyself')"
          :title="$t('pages.me.deleteMyself')"
          :alert="$t('pages.me.deleteMyselfAlert')"
          :check-text="$t('pages.me.deleteMyselfCheck')"
          yes-color="warning"
          @confirm="deleteMyself"
        />
      </template>
    </v-form>
  </v-container>
</template>

<script>
  import { mapState, mapActions } from 'vuex'
  import eventBus from '../event-bus'
  import LoadAvatar from '../components/load-avatar.vue'
  import AddOrganizationMenu from '../components/add-organization-menu.vue'
  import ConfirmMenu from '../components/confirm-menu.vue'
  const moment = require('moment')

  export default {
    components: { LoadAvatar, AddOrganizationMenu, ConfirmMenu },
    data: () => ({
      patch: { firstName: null, lastName: null, birthday: null },
      rejectDialog: false,
      nbCreatedOrgs: null,
      birthdayMenu: false,
      maxBirthday: moment().subtract(13, 'years').toISOString(),
    }),
    computed: {
      ...mapState('session', ['user', 'initialized']),
      ...mapState(['userDetails', 'env']),
      maxCreatedOrgs() {
        if (!this.userDetails) return 0
        return this.userDetails.maxCreatedOrgs !== undefined && this.userDetails.maxCreatedOrgs !== null ? this.userDetails.maxCreatedOrgs : this.env.defaultMaxCreatedOrgs
      },
      showMaxCreatedOrgs() {
        if (!this.userDetails) return false
        if (this.env.defaultMaxCreatedOrgs === -1) return false
        if (this.env.defaultMaxCreatedOrgs === 0 && !this.userDetails.maxCreatedOrgs) return false
        return this.maxCreatedOrgs === -1 ? 'illimité' : ('' + this.maxCreatedOrgs)
      },
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
          this.nbCreatedOrgs = (await this.$axios.$get('api/organizations', { params: { creator: this.user.id, size: 0 } })).count
        },
        immediate: true,
      },
    },
    methods: {
      ...mapActions(['fetchUserDetails']),
      ...mapActions('session', ['logout']),
      initPatch() {
        this.patch.firstName = this.userDetails.firstName
        this.patch.lastName = this.userDetails.lastName
        this.patch.birthday = this.userDetails.birthday
      },
      async save() {
        if (!this.$refs.form.validate()) return
        try {
          await this.$axios.$patch(`api/users/${this.user.id}`, this.patch)
          await this.$axios.$post('api/session/keepalive')
          eventBus.$emit('notification', this.$t('common.modificationOk'))
          this.fetchUserDetails()
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      async changePasswordAction() {
        try {
          let target = this.env.publicUrl + '/login'
          try {
            target += '?redirect=' + encodeURIComponent(window.parent.location.href)
          } catch (err) {
          // no problem, we simply are not in an iframe context
          }
          await this.$axios.$post('api/auth/action', { email: this.user.email, action: 'changePassword', target })
          eventBus.$emit('notification', this.$t('pages.login.changePasswordSent', { email: this.user.email }))
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      async deleteMyself() {
        try {
          await this.$axios.$delete(`api/users/${this.user.id}`)
          await this.logout()
          // reloading top page, so that limits are re-fetched, etc.
          window.top.location.reload()
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
    },
  }
</script>

<style lang="css">
</style>
