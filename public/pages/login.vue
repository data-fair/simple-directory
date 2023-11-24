<template>
  <v-row
    justify="space-around"
    data-iframe-height
    class="mt-6"
  >
    <v-col
      cols="12"
      style="max-width: 500px;"
    >
      <v-row class="justify-center">
        <v-col
          cols="auto"
          class=""
        >
          <img
            v-if="sitePublic"
            :src="sitePublic.logo"
            @alt="$t('pages.login.siteLogo')"
          >
        </v-col>
      </v-row>
      <v-card
        shaped
        class="pa-2"
      >
        <v-card-title primary-title>
          <h1 :class="{headline: true, 'mb-0': true, 'warning--text': adminMode}">
            {{ stepsTitles[step] || email }}
          </h1>
          <div
            v-if="!sitePublic"
            :class="`v-card v-sheet theme--${$vuetify.theme.dark ? 'dark' : 'light'} login-logo-container`"
          >
            <img
              v-if="logoUrl"
              :src="logoUrl"
              @alt="$t('pages.login.siteLogo')"
            >
            <logo v-else />
          </div>
        </v-card-title>
        <v-window
          v-if="step !== null"
          v-model="step"
        >
          <v-window-item
            v-if="separateEmailPasswordSteps"
            value="preLogin"
          >
            <v-card-text>
              <auth-providers-login-links
                :redirect="redirectUrl"
                :email="email"
              />
              <v-text-field
                id="email"
                v-model="email"
                dense
                rounded
                outlined
                :autofocus="true"
                :label="$t('pages.login.emailLabel')"
                :error-messages="emailErrors"
                name="email"
                class="mb-3 hide-autofill"
                hide-details="auto"
                autocomplete="email"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                :disabled="!email"
                color="primary"
                depressed
                @click="preLogin"
              >
                {{ $t('common.next') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>
          <v-window-item value="login">
            <v-card-text>
              <p
                v-if="adminMode"
                class="warning--text"
              >
                {{ $t('pages.login.adminMode') }}
              </p>
              <template v-if="!adminMode && !orgStorage && !separateEmailPasswordSteps">
                <auth-providers-login-links
                  :redirect="redirectUrl"
                  :email="email"
                />
              </template>

              <v-text-field
                id="email"
                v-model="email"
                dense
                rounded
                outlined
                :autofocus="!email"
                :label="$t('pages.login.emailLabel')"
                :error-messages="emailErrors"
                name="email"
                class="mb-3 hide-autofill"
                hide-details="auto"
                autocomplete="email"
              />
              <p
                v-if="env.passwordless && !adminMode"
                class="mb-2 text-caption"
              >
                {{ $t('pages.login.passwordlessMsg1') }} <a
                  tabindex="0"
                  role="button"
                  @click="passwordlessAuth"
                  @keyup.enter="passwordlessAuth"
                >{{ $t('pages.login.passwordlessMsg2') }}</a>
              </p>

              <v-text-field
                id="password"
                v-model="password"
                dense
                rounded
                outlined
                :autofocus="!!email"
                :label="$t('common.password')"
                :error-messages="passwordErrors"
                name="password"
                type="password"
                autocomplete="current-password"
                class="mt-4 hide-autofill"
                hide-details="auto"
                @keyup.enter="passwordAuth"
              />
              <template v-if="twoFARequired">
                <v-text-field
                  id="2fa"
                  v-model="twoFACode"
                  :label="$t('pages.login.2FACode')"
                  :error-messages="twoFAErrors"
                  name="2fa"
                  outlined
                  dense
                  rounded
                  class="mt-4 hide-autofill"
                  hide-details="auto"
                  :autofocus="true"
                  @keyup.enter="passwordAuth"
                >
                  <v-tooltip
                    slot="append-outer"
                    right
                    max-width="400"
                  >
                    <template #activator="{on}">
                      <v-icon v-on="on">
                        mdi-information
                      </v-icon>
                    </template>
                    <div v-html="$t('pages.login.2FAInfo')" />
                  </v-tooltip>
                </v-text-field>
              </template>
              <v-checkbox
                v-if="!adminMode"
                id="rememberMe"
                v-model="rememberMe"
                :class="passwordErrors.length ? 'mt-0' : 'mt-1'"
                dense
                :label="$t('pages.login.rememberMe')"
                hide-details
              />
              <v-row
                v-if="!readonly && !env.onlyCreateInvited && !adminMode"
                class="ma-0"
              >
                <p class="my-1">
                  <a
                    tabindex="0"
                    role="button"
                    @click="createUserStep"
                    @keyup.enter="createUserStep"
                  >{{ $t('pages.login.createUserMsg2') }}</a>
                </p>
              </v-row>
              <v-row
                v-if="!readonly && !adminMode"
                class="ma-0"
              >
                <p class="my-1">
                  <a
                    :title="$t('pages.login.changePasswordTooltip')"
                    tabindex="0"
                    role="button"
                    @click="changePasswordAction"
                    @keyup.enter="passwordAuth"
                  >{{ $t('pages.login.changePassword') }}</a>
                </p>
              </v-row>
            </v-card-text>

            <v-card-actions>
              <v-btn
                v-if="separateEmailPasswordSteps"
                text
                @click="step='preLogin'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                :disabled="!email || !password"
                :color="adminMode ? 'warning' : 'primary'"
                depressed
                @click="passwordAuth"
              >
                {{ $t('common.login') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="tos">
            <v-card-text>
              <p v-html="sitePublic?.tosMessage || $t('pages.login.tosMsg', {tosUrl: env.tosUrl})" />
              <v-checkbox
                v-model="tosAccepted"
                :label="$t('pages.login.tosConfirm')"
              />
            </v-card-text>

            <v-card-actions>
              <v-btn
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                :disabled="!tosAccepted"
                color="primary"
                depressed
                @click="step='createUser'"
              >
                {{ $t('common.next') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="createUser">
            <v-card-text>
              <v-alert
                v-if="invitPayload"
                type="info"
                outlined
                class="mb-6"
              >
                {{ $t('pages.login.createUserInvit', {name: invitPayload.n || invitPayload.name || invitPayload.id }) }}
              </v-alert>
              <auth-providers-login-links
                :redirect="redirectUrl"
                :email="email"
                :invit-token="invitToken"
              />
              <v-form ref="createUserForm">
                <v-text-field
                  id="createuser-email"
                  v-model="email"
                  :autofocus="true"
                  :label="$t('pages.login.emailLabel')"
                  :rules="[v => !!v || '']"
                  name="createuser-email"
                  required
                  outlined
                  dense
                  rounded
                  autocomplete="email"
                  :disabled="!!invitPayload"
                />

                <v-text-field
                  v-if="!sitePublic?.reducedPersonalInfoAtCreation"
                  v-model="newUser.firstName"
                  :label="$t('common.firstName')"
                  name="firstname"
                  outlined
                  dense
                  rounded
                  autocomplete="given-name"
                  @keyup.enter="createUser"
                />

                <v-text-field
                  v-if="!sitePublic?.reducedPersonalInfoAtCreation"
                  v-model="newUser.lastName"
                  :label="$t('common.lastName')"
                  name="lastname"
                  outlined
                  dense
                  rounded
                  autocomplete="family-name"
                  @keyup.enter="createUser"
                />

                <v-text-field
                  id="password"
                  v-model="newUser.password"
                  :label="$t('common.password')"
                  :error-messages="createUserErrors"
                  :rules="[v => !!v || '']"
                  name="newUserPassword"
                  :type="showNewUserPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  outlined
                  dense
                  rounded
                  @keyup.enter="createUser"
                >
                  <template slot="append">
                    <v-icon
                      v-if="newUser.password"
                      @click="showNewUserPassword = !showNewUserPassword"
                    >
                      {{ showNewUserPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
                    </v-icon>
                  </template>
                  <v-tooltip
                    slot="append-outer"
                    right
                    max-width="400"
                  >
                    <template #activator="{on}">
                      <v-icon v-on="on">
                        mdi-information
                      </v-icon>
                    </template>
                    <div v-html="$t('errors.malformedPassword')" />
                  </v-tooltip>
                </v-text-field>

                <v-text-field
                  v-model="newUserPassword2"
                  :label="$t('pages.login.newPassword2')"
                  :rules="[v => !!v || '', v => newUser.password === v || $t('errors.differentPasswords')]"
                  name="newUserPassword2"
                  :type="showNewUserPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  outlined
                  dense
                  rounded
                  @keyup.enter="createUser"
                >
                  <div slot="append-outer">
                    <v-icon style="visibility:hidden">
                      mdi-information
                    </v-icon>
                  </div>
                </v-text-field>
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-btn
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                color="primary"
                depressed
                @click="createUser"
              >
                {{ $t('pages.login.createUserConfirm') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="createUserConfirmed">
            <v-card-text>
              <p>{{ $t('pages.login.createUserConfirmed', {email}) }}</p>
              <p class="text-caption">
                {{ $t('common.spamWarning', {email}) }}
              </p>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="emailConfirmed">
            <v-card-text>
              <p>{{ $t('pages.login.passwordlessConfirmed', {email}) }}</p>
              <p class="text-caption">
                {{ $t('common.spamWarning', {email}) }}
              </p>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="changePasswordSent">
            <v-card-text>
              <p>{{ $t('pages.login.changePasswordSent', {email}) }}</p>
              <p class="text-caption">
                {{ $t('common.spamWarning', {email}) }}
              </p>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="changePassword">
            <v-card-text>
              <v-form ref="changePasswordForm">
                <p>{{ $t('pages.login.newPasswordMsg') }}</p>
                <v-text-field
                  id="email"
                  v-model="email"
                  :label="$t('pages.login.emailLabel')"
                  name="email"
                  autocomplete="email"
                  style="display:none;"
                />
                <v-text-field
                  id="password"
                  v-model="newPassword"
                  :autofocus="true"
                  :label="$t('pages.login.newPassword')"
                  :error-messages="newPasswordErrors"
                  :rules="[v => !!v || '']"
                  name="newPassword"
                  type="password"
                  autocomplete="new-password"
                  outlined
                  dense
                  rounded
                >
                  <v-tooltip
                    slot="append-outer"
                    right
                    max-width="400"
                  >
                    <template #activator="{on}">
                      <v-icon v-on="on">
                        mdi-information
                      </v-icon>
                    </template>
                    <div v-html="$t('errors.malformedPassword')" />
                  </v-tooltip>
                </v-text-field>
                <v-text-field
                  v-model="newPassword2"
                  :label="$t('pages.login.newPassword2')"
                  :rules="[v => !!v || '', v => newPassword === v || $t('errors.differentPasswords')]"
                  name="newPassword2"
                  type="password"
                  autocomplete="new-password"
                  outlined
                  dense
                  rounded
                  @keyup.enter="changePassword"
                >
                  <div slot="append-outer">
                    <v-icon style="visibility:hidden">
                      mdi-information
                    </v-icon>
                  </div>
                </v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                :disabled="!newPassword || newPassword !== newPassword2"
                color="primary"
                depressed
                @click="changePassword"
              >
                {{ $t('common.validate') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="configure2FA">
            <v-card-text>
              <v-alert
                :value="true"
                type="warning"
                outlined
                class="mb-3"
              >
                {{ $t('errors.2FANotConfigured') }}
              </v-alert>

              <template v-if="qrcode">
                <p class="mb-1">
                  {{ $t('pages.login.configure2FAQRCodeMsg') }}
                </p>
                <v-img
                  v-if="qrcode"
                  :src="qrcode"
                  :title="$t('pages.login.configure2FAQRCode')"
                  max-width="170"
                />
                <v-text-field
                  v-model="configure2FACode"
                  :label="$t('pages.login.configure2FACode')"
                  dense
                  outlined
                  rounded
                  style="max-width: 210px;"
                  :autofocus="true"
                  @keyup.enter="validate2FA"
                />
              </template>
            </v-card-text>

            <v-card-actions>
              <v-btn
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                :disabled="!configure2FACode"
                color="primary"
                depressed
                @click="validate2FA"
              >
                {{ $t('common.validate') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="recovery2FA">
            <v-card-text>
              <v-alert
                :value="true"
                type="warning"
                outlined
                class="mb-3"
              >
                {{ $t('pages.login.recovery2FAInfo') }}
              </v-alert>

              <p>
                {{ $t('pages.login.recovery2FACode') }}
                <br>
                {{ recovery }}
                <v-btn
                  :title="$t('pages.login.recovery2FADownload')"
                  icon
                  class="mx-0"
                  @click="downloadRecovery"
                >
                  <v-icon>mdi-download</v-icon>
                </v-btn>
              </p>
            </v-card-text>

            <v-card-actions>
              <v-btn
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
            </v-card-actions>
          </v-window-item>

          <v-window-item value="createOrga">
            <v-card-text>
              <v-alert
                :value="true"
                type="info"
                outlined
                class="mb-3"
              >
                {{ $t('pages.login.createUserOrganizationHelp') }}
              </v-alert>

              <v-switch
                v-model="createOrganization.active"
                :label="$t('pages.login.createUserOrganization')"
              />
              <template v-if="createOrganization.active">
                <v-text-field
                  v-model="createOrganization.name"
                  :label="$t('common.organizationName')"
                  :rules="[v => !!v || '']"
                  name="organizationName"
                  required
                  outlined
                  dense
                  rounded
                />
              </template>
            </v-card-text>

            <v-card-actions>
              <v-btn
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                v-if="createOrganization.active"
                color="primary"
                depressed
                @click="createOrga"
              >
                {{ $t('common.validate') }}
              </v-btn>
              <v-btn
                v-else
                color="primary"
                depressed
                :href="redirectUrl"
              >
                {{ $t('common.continue') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="plannedDeletion">
            <v-card-text>
              <cancel-deletion @cancelled="goToRedirect" />
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                depressed
                :href="redirectUrl"
              >
                {{ $t('common.continue') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="partnerInvitation">
            <v-card-text>
              <partner-invitation @accepted="goToRedirect()" />
            </v-card-text>
          </v-window-item>

          <v-window-item value="changeHost">
            <v-card-text>
              <change-host
                :user="actionPayload"
                :action-token="actionToken"
                @goTo="newStep => step = newStep"
              />
            </v-card-text>
          </v-window-item>

          <v-window-item value="error">
            <v-card-text v-if="error">
              <v-alert
                :value="true"
                type="error"
                outlined
              >
                {{ $te('errors.' + error) ? $t('errors.' + error) : error }}
              </v-alert>
            </v-card-text>

            <v-card-actions>
              <v-btn
                text
                @click="clearError"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
            </v-card-actions>
          </v-window-item>
        </v-window>
      </v-card>
      <p v-if="env.maildev.active">
        <br>
        <a
          :href="env.maildev.url"
          text
        >{{ $t('pages.login.maildevLink') }}</a>
      </p>
    </v-col>
  </v-row>
</template>

<script>

import { mapState, mapActions, mapGetters } from 'vuex'
import jwtDecode from 'jwt-decode'
import eventBus from '../event-bus'

export default {
  data () {
    return {
      dialog: true,
      email: this.$route.query.email,
      emailErrors: [],
      step: null,
      stepsTitles: {
        preLogin: this.$t('pages.login.title'),
        login: this.$t('pages.login.title'),
        emailConfirmed: this.$t('common.checkInbox'),
        createUser: this.$t('pages.login.createUserMsg2'),
        createUserConfirmed: this.$t('pages.login.createUserConfirm'),
        changePasswordSent: this.$t('pages.login.changePassword'),
        error: this.$t('pages.login.error'),
        configure2FA: this.$t('pages.login.configure2FA'),
        recovery2FA: this.$t('pages.login.recovery2FA'),
        createOrga: this.$t('common.createOrganization'),
        plannedDeletion: this.$t('pages.login.plannedDeletion'),
        partnerInvitation: this.$t('pages.login.partnerInvitation'),
        changeHost: this.$t('pages.login.changeHost')
      },
      password: '',
      passwordErrors: [],
      invitToken: this.$route.query.invit_token,
      adminMode: this.$route.query.adminMode === 'true',
      org: this.$route.query.org,
      dep: this.$route.query.dep,
      orgStorage: this.$route.query.org_storage === 'true',
      membersOnly: this.$route.query.members_only === 'true',
      newPassword: null,
      newPassword2: null,
      newPasswordErrors: [],
      tosAccepted: false,
      newUser: {
        firstName: null,
        lastName: null,
        password: null
      },
      createOrganization: {
        active: false,
        name: ''
      },
      createUserErrors: [],
      newUserPassword2: null,
      showNewUserPassword: false,
      error: this.$route.query.error,
      rememberMe: true,
      qrcode: null,
      configure2FACode: null,
      twoFARequired: false,
      twoFACode: null,
      recovery: null,
      twoFAErrors: [],
      plannedDeletion: this.$route.query.planned_deletion
    }
  },
  computed: {
    ...mapState('session', ['user']),
    ...mapState(['env', 'sitePublic', 'authProviders']),
    ...mapGetters(['host', 'mainHost']),
    actionToken () {
      return this.$route.query.action_token
    },
    readonly () {
      return this.env.readonly || this.$route.query.readonly === 'true'
    },
    redirectUrl () {
      return this.$route.query && this.$route.query.redirect
    },
    actionPayload () {
      if (!this.actionToken) return
      return jwtDecode(this.actionToken)
    },
    invitPayload () {
      if (!this.invitToken) return
      return jwtDecode(this.invitToken)
    },
    logoUrl () {
      if (this.$route.query.logo) return this.$route.query.logo
      if (this.org) return `${this.env.publicUrl}/api/avatars/organization/${this.org}/avatar.png`
      if (this.env.theme.logo) return this.env.theme.logo
      return null
    },
    redirectHost () {
      return this.redirectUrl && new URL(this.redirectUrl).host
    },
    separateEmailPasswordSteps () {
      return this.authProviders?.find(p => p.redirectMode?.type === 'emailDomain')
    }
  },
  async created () {
    await this.$store.dispatch('fetchAuthProviders')

    this.step = this.$route.query.step || 'login'

    if (this.step === 'login' && this.separateEmailPasswordSteps) {
      this.step = 'preLogin'
    }

    if (this.actionPayload && this.actionPayload.action === 'changePassword') {
      this.step = 'changePassword'
      this.email = this.actionPayload.email || this.invitPayload.e
    } if (this.actionPayload && this.actionPayload.action === 'changeHost') {
      this.step = 'changeHost'
      this.email = this.actionPayload.email || this.invitPayload.e
    } else if (this.invitPayload) {
      this.createUserStep()
      this.org = this.invitPayload.id
      this.department = this.invitPayload.department
      this.email = this.invitPayload.email || this.invitPayload.e
    } else if (this.plannedDeletion) {
      this.step = 'plannedDeletion'
    }

    if (this.error) {
      this.step = 'error'
    }
  },
  methods: {
    ...mapActions('session', ['switchOrganization']),
    preLogin () {
      const authProvider = this.authProviders.find(p => p.redirectMode?.type === 'emailDomain' && p.redirectMode.emailDomain === this.email.trim().split('@')[1])
      if (authProvider) {
        const url = new URL(`${this.env.publicUrl}/api/auth/${authProvider.type}/${authProvider.id}/login`)
        if (this.redirectUrl) url.searchParams.append('redirect', this.redirectUrl)
        if (this.email) url.searchParams.append('email', this.email)
        if (this.invitToken) url.searchParams.append('invit_token', this.invitToken)
        window.location.href = url.href
      } else {
        this.step = 'login'
      }
    },
    createUserStep () {
      this.step = this.env.tosUrl ? 'tos' : 'createUser'
    },
    async createUser () {
      if (!this.$refs.createUserForm.validate()) return
      try {
        const body = {
          email: this.email,
          ...this.newUser
        }
        const link = await this.$axios.$post('api/users', body, {
          params: {
            redirect: this.redirectUrl,
            org: this.org,
            dep: this.dep,
            invit_token: this.invitToken
          }
        })
        this.createUserErrors = []
        this.password = this.newUser.password
        if (this.invitToken) window.location.href = link
        else this.step = 'createUserConfirmed'
      } catch (error) {
        if (error.response.status >= 500) eventBus.$emit('notification', { error })
        else this.createUserErrors = [error.response.data || error.message]
      }
    },
    async createOrga () {
      if (!this.createOrganization.name) return
      try {
        const body = { name: this.createOrganization.name }
        const orga = await this.$axios.$post('api/organizations', body)
        await this.$axios.$patch('api/users/' + this.user.id, {
          ignorePersonalAccount: true,
          defaultOrg: orga.id
        })
        this.switchOrganization(orga.id)
        this.goToRedirect()
      } catch (error) {
        if (error.response.status >= 500) eventBus.$emit('notification', { error })
        else this.createUserErrors = [error.response.data || error.message]
      }
    },
    async passwordlessAuth () {
      try {
        await this.$axios.$post('api/auth/passwordless', {
          email: this.email,
          rememberMe: this.rememberMe,
          org: this.org,
          dep: this.dep,
          membersOnly: this.membersOnly,
          orgStorage: this.orgStorage
        }, { params: { redirect: this.redirectUrl } })
        this.emailErrors = []
        this.step = 'emailConfirmed'
      } catch (error) {
        if (error.response.status >= 500) eventBus.$emit('notification', { error })
        else this.emailErrors = [error.response.data || error.message]
      }
    },
    async passwordAuth () {
      this.emailErrors = []
      try {
        const link = await this.$axios.$post('api/auth/password', {
          email: this.email,
          password: this.password,
          adminMode: this.adminMode,
          rememberMe: this.rememberMe && !this.adminMode,
          org: this.org,
          dep: this.dep,
          '2fa': this.twoFACode,
          membersOnly: this.membersOnly,
          orgStorage: this.orgStorage
        }, { params: { redirect: this.redirectUrl } })
        window.location.href = link
      } catch (error) {
        if (!error.response) return console.error(error)
        if (error.response.status >= 500) eventBus.$emit('notification', { error })
        else {
          if (error.response.data === '2fa-missing') {
            this.step = 'configure2FA'
            this.passwordErrors = []
            this.init2FA()
          } else if (error.response.data === '2fa-required') {
            this.passwordErrors = []
            this.twoFARequired = true
            this.twoFAErrors = []
          } else if (error.response.data === '2fa-bad-token') {
            this.passwordErrors = []
            this.twoFAErrors = [this.$t('errors.bad2FAToken')]
          } else {
            this.passwordErrors = [error.response.data || error.message]
            this.twoFAErrors = []
          }
        }
      }
    },
    async changePasswordAction () {
      try {
        await this.$axios.$post('api/auth/action', {
          email: this.email,
          action: 'changePassword',
          target: window.location.href
        })
        this.step = 'changePasswordSent'
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async changePassword () {
      if (!this.$refs.changePasswordForm.validate()) return
      try {
        await this.$axios.$post(`api/users/${this.actionPayload.id}/password`, {
          password: this.newPassword
        }, { params: { action_token: this.actionToken } })
        this.password = this.newPassword
        this.step = 'login'
        this.$router.replace({ query: { ...this.$route.query, action_token: undefined } })
      } catch (error) {
        if (error.response.status >= 500) eventBus.$emit('notification', { error })
        else this.newPasswordErrors = [error.response.data || error.message]
      }
    },
    async clearError () {
      this.step = 'login'
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.location.href = url.href
    },
    async init2FA () {
      try {
        // initialize secret
        const res = await this.$axios.$post('api/2fa', {
          email: this.email,
          password: this.password
        })
        this.qrcode = res.qrcode
        this.configure2FACode = null
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async validate2FA () {
      try {
        // validate secret with initial token
        const res = await this.$axios.$post('api/2fa', {
          email: this.email,
          password: this.password,
          token: this.configure2FACode
        })
        this.configure2FACode = null
        this.recovery = res.recovery
        this.step = 'recovery2FA'
        this.twoFARequired = true
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    downloadRecovery () {
      const element = document.createElement('a')
      const contentHeader = this.$t('recovery2FAContent', { name: `${window.location.host}` })
      const content = `${contentHeader}

  ${this.recovery}`
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
      element.setAttribute('download', window.location.host.replace(/\./g, '-') + '-2fa-recovery.txt')
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    },
    goToRedirect () {
      window.location.href = this.redirectUrl
    }
  }
}
</script>

<style>

.v-application.page-login .login-logo-container {
  position: absolute;
  right: -20px;
  top: -20px;
  width: 80px;
  height: 80px;
  border-radius: 40px;
  padding: 8px;
  overflow: hidden;
}
.v-application.page-login .login-logo-container img, .v-application.page-login .login-logo-container svg {
  width: 100%;
}

/* https://stackoverflow.com/a/37432260 */
.hide-autofill.theme--dark input:-webkit-autofill,
.hide-autofill.theme--dark input:-webkit-autofill:hover,
.hide-autofill.theme--dark input:-webkit-autofill:focus,
.hide-autofill.theme--dark input:-webkit-autofill:active {
    transition: background-color 5000s ease-in-out 0s;
    -webkit-text-fill-color: white !important;
}
.hide-autofill.theme--light input:-webkit-autofill,
.hide-autofill.theme--light input:-webkit-autofill:hover,
.hide-autofill.theme--light input:-webkit-autofill:focus,
.hide-autofill.theme--light input:-webkit-autofill:active {
    transition: background-color 5000s ease-in-out 0s;
    -webkit-text-fill-color: rgba(0, 0, 0, 0.87) !important;
}
</style>
