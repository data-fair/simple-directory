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
      <v-card
        shaped
        class="pa-2"
      >
        <v-card-title primary-title>
          <h3 :class="{headline: true, 'mb-0': true, 'warning--text': adminMode}">
            {{ stepsTitles[step] || email }}
          </h3>
          <div :class="`v-card v-sheet theme--${$vuetify.theme.dark ? 'dark' : 'light'} login-logo-container`">
            <img v-if="logoUrl" :src="logoUrl">
            <logo v-else />
          </div>
        </v-card-title>
        <v-window v-model="step">
          <v-window-item value="login">
            <v-card-text>
              <p v-if="adminMode" class="warning--text">
                {{ $t('pages.login.adminMode') }}
              </p>

              <template v-if="env.oauth.length && !adminMode">
                <!--<v-layout row>
                  <p class="mb-0">{{ $t('pages.login.oauth') }}</p>
                </v-layout>-->
                <oauth-login-links :redirect="redirectUrl" />
              </template>

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
              />
              <p v-if="env.passwordless && !adminMode" class="mb-2 text-caption">
                {{ $t('pages.login.passwordlessMsg1') }} <a @click="passwordlessAuth">{{ $t('pages.login.passwordlessMsg2') }}</a>
              </p>

              <v-text-field
                id="password"
                v-model="password"
                dense
                rounded
                outlined
                :label="$t('common.password')"
                :error-messages="passwordErrors"
                name="password"
                type="password"
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
                  outlined
                  dense
                  rounded
                  class="mt-4 hide-autofill"
                  hide-details="auto"
                  autofocus
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
              />
              <v-row v-if="!env.onlyCreateInvited && !adminMode" class="mx-0">
                <p class="mb-2">
                  <a @click="createUserStep">{{ $t('pages.login.createUserMsg2') }}</a>
                </p>
              </v-row>
              <v-row v-if="!env.readonly && !adminMode" class="mx-0">
                <p class="mb-0">
                  <a :title="$t('pages.login.changePasswordTooltip')" @click="changePasswordAction">{{ $t('pages.login.changePassword') }}</a>
                </p>
              </v-row>
            </v-card-text>

            <v-card-actions>
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
              <p v-if="host !== mainHost" v-html="$t('pages.login.separateDomain', {host, mainHost})" />
              <p v-html="$t('pages.login.tosMsg', {tosUrl: env.tosUrl})" />
              <v-checkbox
                v-model="tosAccepted"
                :label="$t('pages.login.tosConfirm')"
              />
            </v-card-text>

            <v-card-actions>
              <v-btn
                v-if="step !== 1"
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
              <v-form ref="createUserForm">
                <v-text-field
                  id="createuser-email"
                  v-model="email"
                  :autofocus="true"
                  :label="$t('pages.login.emailLabel')"
                  :rules="[v => !!v || '']"
                  name="createuser-email"
                  required
                />

                <v-text-field
                  v-model="newUser.firstName"
                  :label="$t('common.firstName')"
                  name="firstname"
                  @keyup.enter="createUser"
                />

                <v-text-field
                  v-model="newUser.lastName"
                  :label="$t('common.lastName')"
                  name="lastname"
                  @keyup.enter="createUser"
                />

                <v-text-field
                  id="password"
                  v-model="newUser.password"
                  :label="$t('common.password')"
                  :error-messages="createUserErrors"
                  name="newUserPassword"
                  type="password"
                  @keyup.enter="createUser"
                />

                <v-text-field
                  v-model="newUserPassword2"
                  :label="$t('pages.login.newPassword2')"
                  :error-messages="newUser.password !== newUserPassword2 ? ['Les mots de passe sont différents'] : []"
                  name="newUserPassword2"
                  type="password"
                />
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-btn
                v-if="step !== 1"
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                :disabled="!newUser.password || newUser.password !== newUserPassword2"
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
                v-if="step !== 1"
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
                v-if="step !== 1"
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
                v-if="step !== 1"
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="changePassword">
            <v-card-text>
              <p>{{ $t('pages.login.newPasswordMsg') }}</p>
              <v-text-field
                v-model="newPassword"
                :autofocus="true"
                :label="$t('pages.login.newPassword')"
                :error-messages="newPasswordErrors"
                name="newPassword"
                type="password"
                outlined
                dense
                rounded
              />
              <v-text-field
                v-model="newPassword2"
                :label="$t('pages.login.newPassword2')"
                :error-messages="newPassword !== newPassword2 ? ['Les mots de passe sont différents'] : []"
                name="newPassword2"
                type="password"
                outlined
                dense
                rounded
              />
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
                outline
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
                  @keyup.enter="validate2FA"
                />
              </template>
            </v-card-text>

            <v-card-actions>
              <v-btn
                v-if="step !== 1"
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
                outline
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
                v-if="step !== 1"
                text
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
            </v-card-actions>
          </v-window-item>

          <v-window-item value="error">
            <v-card-text v-if="error">
              <v-alert
                :value="true"
                type="error"
                outline
              >
                {{ $t('errors.' + error) }}
              </v-alert>
            </v-card-text>
          </v-window-item>
        </v-window>
      </v-card>
      <p v-if="env.maildev.active">
        <br>
        <a :href="env.maildev.url" text>{{ $t('pages.login.maildevLink') }}</a>
      </p>
    </v-col>
  </v-row>
</template>

<script>

  import { mapState } from 'vuex'
  import jwtDecode from 'jwt-decode'
  import logo from '../components/logo.vue'
  import OauthLoginLinks from '../components/oauth-login-links.vue'
  import eventBus from '../event-bus'

  export default {
    components: {
      logo,
      OauthLoginLinks,
    },
    data() {
      return {
        dialog: true,
        email: this.$route.query.email,
        emailErrors: [],
        step: this.$route.query.step || 'login',
        stepsTitles: {
          login: this.$t('pages.login.title'),
          emailConfirmed: this.$t('common.checkInbox'),
          createUser: this.$t('pages.login.createUserMsg2'),
          createUserConfirmed: this.$t('pages.login.createUserConfirm'),
          changePasswordSent: this.$t('pages.login.changePassword'),
          error: this.$t('pages.login.error'),
          configure2FA: this.$t('pages.login.configure2FA'),
          recovery2FA: this.$t('pages.login.recovery2FA'),
        },
        password: '',
        passwordErrors: [],
        actionToken: this.$route.query.action_token,
        adminMode: this.$route.query.adminMode === 'true',
        org: this.$route.query.org,
        newPassword: null,
        newPassword2: null,
        newPasswordErrors: [],
        tosAccepted: false,
        newUser: {
          firstName: null,
          lastName: null,
          password: null,
        },
        createUserErrors: [],
        newUserPassword2: null,
        error: this.$route.query.error,
        rememberMe: true,
        qrcode: null,
        configure2FACode: null,
        twoFARequired: false,
        twoFACode: null,
        recovery: null,
        twoFAErrors: [],
      }
    },
    computed: {
      ...mapState('session', ['user']),
      ...mapState(['env']),
      redirectUrl() {
        return this.$route.query && this.$route.query.redirect
      },
      actionPayload() {
        if (!this.actionToken) return
        return jwtDecode(this.actionToken)
      },
      logoUrl() {
        if (this.org) return `${this.env.publicUrl}/api/avatars/organization/${this.org}/avatar.png`
        if (this.env.theme.logo) return this.env.theme.logo
        return null
      },
      host() {
        return window.location.host
      },
      mainHost() {
        return new URL(this.env.publicUrl).host
      },
    },
    created() {
      if (this.actionPayload) {
        this.step = 'changePassword'
        this.email = this.actionPayload.email
      } else if (this.error) {
        this.step = 'error'
      } else {
        this.step = 'login'
      }
    },
    methods: {
      createUserStep() {
        this.step = this.env.tosUrl ? 'tos' : 'createUser'
      },
      async createUser() {
        if (!this.$refs.createUserForm.validate()) return
        try {
          await this.$axios.$post('api/users', { email: this.email, ...this.newUser }, { params: { redirect: this.redirectUrl } })
          this.createUserErrors = []
          this.step = 'createUserConfirmed'
        } catch (error) {
          if (error.response.status >= 500) eventBus.$emit('notification', { error })
          else this.createUserErrors = [error.response.data || error.message]
        }
      },
      async passwordlessAuth() {
        try {
          await this.$axios.$post('api/auth/passwordless', {
            email: this.email,
            rememberMe: this.rememberMe,
            org: this.org,
          }, { params: { redirect: this.redirectUrl } })
          this.emailErrors = []
          this.step = 'emailConfirmed'
        } catch (error) {
          if (error.response.status >= 500) eventBus.$emit('notification', { error })
          else this.emailErrors = [error.response.data || error.message]
        }
      },
      async passwordAuth() {
        this.emailErrors = []
        try {
          const link = await this.$axios.$post('api/auth/password', {
            email: this.email,
            password: this.password,
            adminMode: this.adminMode,
            rememberMe: this.rememberMe && !this.adminMode,
            org: this.org,
            '2fa': this.twoFACode,
          }, { params: { redirect: this.redirectUrl } })
          // NOTE: this will not be necessary anylonger if we remove the deprecated id_token query param
          const linkUrl = new URL(link)
          linkUrl.searchParams.delete('id_token')
          window.location.href = linkUrl.href
        } catch (error) {
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
      async changePasswordAction() {
        try {
          await this.$axios.$post('api/auth/action', {
            email: this.email,
            action: 'changePassword',
            target: window.location.href,
          })
          this.step = 'changePasswordSent'
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      async changePassword() {
        try {
          await this.$axios.$post(`api/users/${this.actionPayload.id}/password`, {
            password: this.newPassword,
          }, { params: { action_token: this.actionToken } })
          this.password = this.newPassword
          this.step = 'login'
          this.$router.replace({ query: { ...this.$route.query, action_token: undefined } })
          this.passwordAuth()
        } catch (error) {
          if (error.response.status >= 500) eventBus.$emit('notification', { error })
          else this.newPasswordErrors = [error.response.data || error.message]
        }
      },
      async init2FA() {
        try {
          // initialize secret
          const res = await this.$axios.$post('api/2fa', {
            email: this.email,
            password: this.password,
          })
          this.qrcode = res.qrcode
          this.configure2FACode = null
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      async validate2FA() {
        try {
          // validate secret with initial token
          const res = await this.$axios.$post('api/2fa', {
            email: this.email,
            password: this.password,
            token: this.configure2FACode,
          })
          this.configure2FACode = null
          this.recovery = res.recovery
          this.step = 'recovery2FA'
          this.twoFARequired = true
        } catch (error) {
          eventBus.$emit('notification', { error })
        }
      },
      downloadRecovery() {
        var element = document.createElement('a')
        const content = `Code de récupération authentification 2 facteurs ${window.location.host}

  ${this.recovery}`
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
        element.setAttribute('download', window.location.host.replace(/\./g, '-') + '-2fa-recovery.txt')
        element.style.display = 'none'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
      },
    },
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
