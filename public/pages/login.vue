<template>
  <v-layout row justify-space-around>
    <v-flex xs12 sm8 md6 lg4 xl3>
      <v-card raised class="pa-2">
        <v-card-title primary-title>
          <h3 :class="{headline: true, 'mb-0': true, 'warning--text': adminMode}">{{ stepsTitles[step] || email }}</h3>
          <div :class="`v-card v-card--raised theme--${env.theme.dark ? 'dark' : 'light'} login-logo-container`">
            <img v-if="env.theme.logo" :src="env.theme.logo">
            <logo v-else/>
          </div>
        </v-card-title>
        <v-window v-model="step">
          <v-window-item value="login">
            <v-card-text>
              <v-layout v-if="adminMode" row>
                <p class="warning--text">{{ $t('pages.login.adminMode') }}</p>
              </v-layout>

              <template v-if="env.oauth.length && !adminMode">
                <!--<v-layout row>
                  <p class="mb-0">{{ $t('pages.login.oauth') }}</p>
                </v-layout>-->
                <oauth-login-links class="mb-3" />
              </template>

              <v-text-field
                id="email"
                :autofocus="true"
                :label="$t('pages.login.emailLabel')"
                v-model="email"
                name="email"
              />
              <v-layout v-if="env.passwordless && !adminMode" row class="caption">
                <p class="mb-2">{{ $t('pages.login.passwordlessMsg1') }} <a @click="passwordlessAuth">{{ $t('pages.login.passwordlessMsg2') }}</a></p>
              </v-layout>

              <v-text-field
                id="password"
                :label="$t('common.password')"
                v-model="password"
                :error-messages="passwordErrors"
                name="password"
                type="password"
                @keyup.enter="passwordAuth"
              />
              <v-layout v-if="!env.onlyCreateInvited && !adminMode" row>
                <p class="mb-2"><a @click="createUserStep">{{ $t('pages.login.createUserMsg2') }}</a></p>
              </v-layout>
              <v-layout v-if="!env.readonly && !adminMode" row>
                <p class="mb-0"><a :title="$t('pages.login.changePasswordTooltip')" @click="changePasswordAction">{{ $t('pages.login.changePassword') }}</a></p>
              </v-layout>

            </v-card-text>

            <v-card-actions>
              <v-spacer/>
              <v-btn :disabled="!email || !password" :color="adminMode ? 'warning' : 'primary'" depressed @click="passwordAuth">
                {{ $t('common.login') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="tos">
            <v-card-text>
              <v-layout row>
                <p v-html="$t('pages.login.tosMsg', {tosUrl: env.tosUrl})"/>
              </v-layout>
              <v-layout row>
                <v-checkbox
                  :label="$t('pages.login.tosConfirm')"
                  v-model="tosAccepted"
                />
              </v-layout>
            </v-card-text>

            <v-card-actions>
              <v-btn v-if="step !== 1" flat @click="step='login'">
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer/>
              <v-btn :disabled="!tosAccepted" color="primary" depressed @click="step='createUser'">
                {{ $t('common.next') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="createUser">
            <v-card-text>
              <v-form ref="createUserForm">
                <v-text-field
                  id="createuser-email"
                  :autofocus="true"
                  :label="$t('pages.login.emailLabel')"
                  v-model="email"
                  :rules="[v => !!v || '']"
                  name="createuser-email"
                  required
                />

                <v-text-field
                  :label="$t('common.firstName')"
                  v-model="newUser.firstName"
                  name="firstname"
                  @keyup.enter="createUser"
                />

                <v-text-field
                  :label="$t('common.lastName')"
                  v-model="newUser.lastName"
                  name="lastname"
                  @keyup.enter="createUser"
                />

                <v-text-field
                  id="password"
                  :label="$t('common.password')"
                  v-model="newUser.password"
                  :error-messages="createUserErrors"
                  name="password"
                  type="password"
                  @keyup.enter="createUser"
                />
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-btn v-if="step !== 1" flat @click="step='login'">
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer/>
              <v-btn depressed color="primary" @click="createUser">
                {{ $t('pages.login.createUserConfirm') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="createUserConfirmed">
            <v-card-text>
              <p>{{ $t('pages.login.createUserConfirmed', {email}) }}</p>
              <p class="caption">{{ $t('common.spamWarning', {email}) }}</p>
            </v-card-text>
            <v-card-actions>
              <v-btn v-if="step !== 1" flat @click="step='login'">
                {{ $t('common.back') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="emailConfirmed">
            <v-card-text>
              <p>{{ $t('pages.login.passwordlessConfirmed', {email}) }}</p>
              <p class="caption">{{ $t('common.spamWarning', {email}) }}</p>
            </v-card-text>
            <v-card-actions>
              <v-btn v-if="step !== 1" flat @click="step='login'">
                {{ $t('common.back') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="changePasswordSent">
            <v-card-text>
              <p>{{ $t('pages.login.changePasswordSent', {email}) }}</p>
              <p class="caption">{{ $t('common.spamWarning', {email}) }}</p>
            </v-card-text>
            <v-card-actions>
              <v-btn v-if="step !== 1" flat @click="step='login'">
                {{ $t('common.back') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="changePassword">
            <v-card-text>
              <p>{{ $t('pages.login.newPasswordMsg') }}</p>
              <v-text-field
                :autofocus="true"
                :label="$t('pages.login.newPassword')"
                v-model="newPassword"
                :error-messages="newPasswordErrors"
                name="newPassword"
                type="password"
              />
              <v-text-field
                :label="$t('pages.login.newPassword2')"
                v-model="newPassword2"
                :error-messages="newPassword !== newPassword2 ? ['Les mots de passe sont différents'] : []"
                name="newPassword2"
                type="password"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer/>
              <v-btn :disabled="!newPassword || newPassword !== newPassword2" color="primary" depressed @click="changePassword">
                {{ $t('common.validate') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

        </v-window>

      </v-card>
      <p v-if="env.maildev.active">
        <br>
        <a :href="env.maildev.url" flat>{{ $t('pages.login.maildevLink') }}</a>
      </p>
    </v-flex>
  </v-layout>

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
    OauthLoginLinks
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
        changePasswordSent: this.$t('pages.login.changePassword')
      },
      password: '',
      passwordErrors: [],
      actionToken: this.$route.query.action_token,
      adminMode: this.$route.query.adminMode === 'true',
      newPassword: null,
      newPassword2: null,
      newPasswordErrors: [],
      tosAccepted: false,
      newUser: {
        firstName: null,
        lastName: null,
        password: null
      },
      createUserErrors: []
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
    }
  },
  created() {
    if (this.actionPayload) {
      this.step = 'changePassword'
      this.email = this.actionPayload.email
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
        await this.$axios.$post('api/auth/passwordless', { email: this.email }, { params: { redirect: this.redirectUrl } })
        this.emailErrors = []
        this.step = 'emailConfirmed'
      } catch (error) {
        if (error.response.status >= 500) eventBus.$emit('notification', { error })
        else this.emailErrors = [error.response.data || error.message]
      }
    },
    async passwordAuth() {
      try {
        const link = await this.$axios.$post('api/auth/password', { email: this.email, password: this.password, adminMode: this.adminMode }, { params: { redirect: this.redirectUrl } })
        window.location.href = link
      } catch (error) {
        if (error.response.status >= 500) eventBus.$emit('notification', { error })
        else this.passwordErrors = [error.response.data || error.message]
      }
    },
    async changePasswordAction() {
      try {
        await this.$axios.$post('api/auth/action', { email: this.email, action: 'changePassword', target: window.location.href })
        this.step = 'changePasswordSent'
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async changePassword() {
      try {
        await this.$axios.$post(`api/users/${this.actionPayload.id}/password`, { password: this.newPassword }, { params: { 'action_token': this.actionToken } })
        const link = await this.$axios.$post('api/auth/password', { email: this.email, password: this.newPassword }, { params: { redirect: this.redirectUrl } })
        window.location.href = link
      } catch (error) {
        if (error.response.status >= 500) eventBus.$emit('notification', { error })
        else this.newPasswordErrors = [error.response.data || error.message]
      }
    }
  }
}
</script>

<style lang="less">
  .application.page-login {
    .login-logo-container {
      position: absolute;
      right: -20px;
      top: -20px;
      width: 80px;
      height: 80px;
      border-radius: 40px;

      padding: 8px;
      overflow: hidden;

      img, svg {
        width: 100%;
      }
    }
  }
</style>
