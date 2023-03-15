<template lang="html">
  <v-container
    data-iframe-height
    :fluid="$route.query.fluid === 'true'"
    :class="{'pa-0': $route.query.fluid === 'true'}"
    :style="$route.query.fluid === 'true' ? '' : 'max-width:600px;'"
  >
    <h2 class="text-h4 mb-4">
      <v-icon
        large
        color="primary"
        style="top:-2px"
      >
        mdi-account-circle
      </v-icon>
      {{ $t('common.myAccount') }}
    </h2>
    <p
      v-if="host !== mainHost"
      v-html="$t('pages.me.separateDomain', {host, mainHost})"
    />
    <v-form
      v-if="user"
      ref="form"
      data-iframe-height
      @submit="save"
    >
      <v-text-field
        v-model="user.email"
        :label="$t('common.email')"
        :disabled="true"
        name="email"
      />

      <load-avatar
        v-if="userDetails && env.avatars.users"
        :owner="{...userDetails, type: 'user'}"
        :disabled="!userDetails || readonly"
      />

      <v-row dense>
        <v-col cols="6">
          <v-text-field
            v-model="patch.firstName"
            :label="$t('common.firstName')"
            :disabled="!userDetails || readonly"
            name="firstName"
            :rules="[v => (!v || v.length < 100) || $t('common.tooLong')]"
            outlined
            dense
            @change="save"
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            v-model="patch.lastName"
            :label="$t('common.lastName')"
            :disabled="!userDetails || readonly"
            name="lastName"
            :rules="[v => (!v || v.length < 100) || $t('common.tooLong')]"
            outlined
            dense
            @change="save"
          />
        </v-col>
        <v-col
          v-if="!env.noBirthday"
          cols="6"
        >
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
                :value="patch.birthday && $d(new Date(patch.birthday))"
                :label="$t('common.birthday')"
                :disabled="!userDetails || readonly"
                append-icon="mdi-calendar"
                readonly
                clearable
                outlined
                dense
                hide-details
                v-on="on"
                @click:clear="patch.birthday = null; save()"
              />
            </template>
            <v-date-picker
              v-model="patch.birthday"
              :max="maxBirthday"
              no-title
              :active-picker.sync="activeBirthDayPicker"
              @change="birthdayMenu = false; save()"
            />
          </v-menu>
        </v-col>
        <v-col v-if="!readonly">
          <v-btn
            color="primary"
            text
            :title="$t('pages.login.changePasswordTooltip')"
            @click="changePasswordAction"
          >
            {{ $t('pages.login.changePassword') }}
          </v-btn>
        </v-col>
      </v-row>

      <v-row
        v-if="userIdentities.length"
        class="mx-0 mt-6"
      >
        <v-btn
          v-for="identity of userIdentities"
          :key="identity.type + identity.id"
          :color="contrastColor(identity.color)"
          :href="identity.user.url"
          dark
          small
          rounded
          depressed
          class="pl-0 pr-3 mr-2 mb-1 text-none white--text"
        >
          <v-avatar
            size="28"
            color="white"
            class="elevation-4"
            style="left:-1px; top: -1px;"
          >
            <v-icon
              v-if="identity.icon"
              :color="contrastColor(authProvider.color)"
            >
              {{ identity.icon }}
            </v-icon>
            <img
              v-else-if="identity.img"
              :src="identity.img"
              :alt="identity.title"
            >
          </v-avatar>
          &nbsp;&nbsp;{{ identity.title }}{{ identity.name ? ' - ' + identity.name : '' }}
        </v-btn>
      </v-row>

      <template v-if="host === mainHost">
        <h2 class="text-h4 mt-10 mb-4">
          <v-icon
            large
            color="primary"
            style="top:-2px"
          >
            mdi-account-group
          </v-icon>
          {{ $t('common.myOrganizations') }}
        </h2>

        <div v-if="userDetails">
          <template v-if="userDetails.organizations.length">
            <template
              v-for="orga in userDetails.organizations"
            >
              <span
                v-if="orga.role"
                :key="'org-' + orga.id + '-' + orga.department"
              >
                {{ orga.name }} <span v-if="orga.department">- {{ orga.departmentName || orga.department }}</span> ({{ orga.role }})
              </span>
            </template>
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

        <add-organization-menu v-if="!readonly && (maxCreatedOrgs === -1 || maxCreatedOrgs > nbCreatedOrgs)" />
      </template>

      <h2 class="text-h4 mt-10 mb-4">
        <v-icon
          large
          color="primary"
          style="top:-2px"
        >
          mdi-cog
        </v-icon>
        {{ $t('common.settings') }}
      </h2>

      <template v-if="userDetails && (showIgnorePersonalAccount || defaultOrgItems.length > 1)">
        <h2 class="text-h5 mt-8 mb-4">
          {{ $t('pages.me.accountChanges') }}
        </h2>
        <v-checkbox
          v-if="showIgnorePersonalAccount"
          v-model="patch.ignorePersonalAccount"
          :label="$t('pages.me.ignorePersonalAccount')"
          :disabled="readonly"
          name="ignorePersonalAccount"
          @change="save"
        />
        <v-select
          v-if="defaultOrgItems.length > 1"
          v-model="defaultOrg"
          :label="$t('pages.me.defaultOrg')"
          :disabled="readonly"
          name="defaultOrg"
          :items="defaultOrgItems"
          :item-value="(org) => org.id + '-' + org.department"
          :item-text="(org) => `${org.name}` + (org.department ? ` - ${org.departmentName || org.department}` : '')"
          clearable
          outlined
          dense
          return-object
          @change="save"
        />
      </template>

      <template v-if="env.userSelfDelete && !readonly && userDetails">
        <h2 class="text-h5 mt-8 mb-4">
          {{ $t('pages.me.operations') }}
        </h2>
        <confirm-menu
          v-if="!userDetails.plannedDeletion"
          :button-text="$t('pages.me.deleteMyself', {name: user.name})"
          :title="$t('pages.me.deleteMyself', {name: user.name})"
          :alert="$t('pages.me.deleteMyselfAlert', {plannedDeletionDelay: env.plannedDeletionDelay})"
          :check-text="$t('pages.me.deleteMyselfCheck', {name: user.name})"
          yes-color="warning"
          @confirm="deleteMyself"
        />
        <cancel-deletion
          v-else
          @cancelled="fetchUserDetails"
        />
      </template>
    </v-form>
  </v-container>
</template>

<script>
import { mapState, mapActions, mapGetters } from 'vuex'
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
    activeBirthDayPicker: null
  }),
  computed: {
    ...mapState('session', ['user', 'initialized']),
    ...mapState(['userDetails', 'env', 'authProviders']),
    ...mapGetters(['contrastColor']),
    readonly () {
      return this.env.readonly || this.user.orgStorage
    },
    maxCreatedOrgs () {
      if (!this.userDetails) return 0
      return this.userDetails.maxCreatedOrgs !== undefined && this.userDetails.maxCreatedOrgs !== null ? this.userDetails.maxCreatedOrgs : this.env.defaultMaxCreatedOrgs
    },
    showMaxCreatedOrgs () {
      if (!this.userDetails) return false
      if (this.env.defaultMaxCreatedOrgs === -1) return false
      if (this.env.defaultMaxCreatedOrgs === 0 && !this.userDetails.maxCreatedOrgs) return false
      return this.maxCreatedOrgs === -1 ? 'illimité' : ('' + this.maxCreatedOrgs)
    },
    host () {
      return window.location.host
    },
    mainHost () {
      return new URL(this.env.mainPublicUrl).host
    },
    defaultOrgItems () {
      return (this.patch.ignorePersonalAccount ? [] : [{ id: '', name: this.$t('common.userAccount') }]).concat(this.userDetails.organizations)
    },
    showIgnorePersonalAccount () {
      // invitation mode only (means user should always be in an orga)
      // ignorePersonalAccount should already be true in this case
      if (this.env.onlyCreateInvited && this.userDetails.ignorePersonalAccount) return false
      // user only has a personal account
      // ignorePersonalAccount should already be false in this case
      if (this.user.organizations.length === 0 && !this.userDetails.ignorePersonalAccount) return false
      return true
    },
    defaultOrg: {
      get () {
        return {
          id: this.patch.defaultOrg,
          department: this.patch.defaultDep
        }
      },
      set (value) {
        if (value) {
          this.patch.defaultOrg = value.id
          this.patch.defaultDep = value.department || ''
        } else {
          this.patch.defaultOrg = this.patch.defaultDep = ''
        }
      }
    },
    userIdentities () {
      if (!this.authProviders || !this.userDetails) return []
      return this.authProviders.map(p => ({
        ...p,
        user: this.userDetails[p.type] && this.userDetails[p.type][p.id]
      })).filter(p => !!p.user).map(p => ({ ...p, name: p.user.login || p.user.name }))
    }
  },
  watch: {
    birthdayMenu (val) {
      if (val) setTimeout(() => { this.activeBirthDayPicker = 'YEAR' })
    },
    userDetails () {
      this.initPatch()
    },
    initialized: {
      async handler () {
        if (!this.initialized) return
        if (!this.user) this.$router.push(this.localePath('login'))
        if (this.userDetails) this.initPatch()
        this.nbCreatedOrgs = (await this.$axios.$get('api/organizations', { params: { creator: this.user.id, size: 0 } })).count
      },
      immediate: true
    }
  },
  created () {
    this.$store.dispatch('fetchAuthProviders')
  },
  methods: {
    ...mapActions(['fetchUserDetails']),
    ...mapActions('session', ['logout']),
    initPatch () {
      this.patch.firstName = this.userDetails.firstName
      this.patch.lastName = this.userDetails.lastName
      this.patch.birthday = this.userDetails.birthday
      this.patch.ignorePersonalAccount = this.userDetails.ignorePersonalAccount || false
      this.patch.defaultOrg = this.userDetails.defaultOrg || ''
      this.patch.defaultDep = this.userDetails.defaultDep || ''
    },
    async save (e) {
      if (e && e.preventDefault) e.preventDefault()
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
    async changePasswordAction () {
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
    async deleteMyself () {
      try {
        await this.$axios.$patch(`api/users/${this.user.id}`, {
          plannedDeletion: moment().add(process.env.plannedDeletionDelay, 'days').format('YYYY-MM-DD')
        })
        // await this.logout()
        // reloading top page, so that limits are re-fetched, etc.
        // window.top.location.reload()

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
