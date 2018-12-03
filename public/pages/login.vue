<template>
  <v-layout row justify-space-around>
    <v-flex xs12 sm8 md6 lg4 xl3>
      <v-card raised class="pa-3">
        <v-card-title primary-title>
          <h3 class="headline mb-0">{{ stepsTitles[step] || email }}</h3>
          <div :class="`v-card v-card--raised theme--${env.theme.dark ? 'dark' : 'light'} login-logo-container`">
            <img v-if="env.theme.logo" :src="env.theme.logo">
            <logo v-else/>
          </div>
        </v-card-title>
        <v-window v-model="step">
          <v-window-item value="email">
            <v-card-text>
              <v-text-field
                id="email"
                :autofocus="true"
                :label="$t('pages.login.emailLabel')"
                v-model="email"
                :error-messages="emailErrors"
                name="email"
                @keyup.enter="step='password'"
              />
              <v-layout row>
                <p>{{ $t('pages.login.passwordlessMsg1') }} <a @click="passwordlessAuth">{{ $t('pages.login.passwordlessMsg2') }}</a></p>
              </v-layout>
              <v-layout v-if="$t('pages.login.conditionsCaption')" row wrap class="pt-4">
                <p class="caption mb-1" v-html="$t('pages.login.conditionsCaption')"/>
              </v-layout>
            </v-card-text>

            <v-card-actions>
              <v-spacer/>
              <v-btn :disabled="!email" color="primary" depressed @click="step='password'">
                {{ $t('common.next') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="password">
            <v-card-text>

              <v-text-field
                id="password"
                :autofocus="true"
                :label="$t('common.password')"
                v-model="password"
                :error-messages="passwordErrors"
                name="password"
                type="password"
                @keyup.enter="passwordAuth"
              />

              <v-layout v-if="!env.readonly" row>
                <v-spacer/>
                <p><a @click="changePasswordAction">{{ $t('pages.login.changePassword') }}</a></p>
              </v-layout>
            </v-card-text>

            <v-card-actions>
              <v-btn v-if="step !== 1" flat @click="step='email'">
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer/>
              <v-btn :disabled="step === 1 && !email" color="primary" depressed @click="passwordAuth">
                Valider
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="emailConfirmed">
            <v-card-text>
              <p>{{ $t('pages.login.passwordlessConfirmed', {email}) }}</p>
              <p v-if="!env.onlyCreateInvited">{{ $t('pages.login.passwordlessCreate', {email}) }}</p>
              <p class="caption">{{ $t('common.spamWarning', {email}) }}</p>
            </v-card-text>
          </v-window-item>

          <v-window-item value="changePasswordSent">
            <v-card-text>
              <p>{{ $t('pages.login.changePasswordSent', {email}) }}</p>
              <p class="caption">{{ $t('common.spamWarning', {email}) }}</p>
            </v-card-text>
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
              <v-btn v-if="step !== 1" flat @click="step='email'">
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer/>
              <v-btn :disabled="!newPassword || newPassword !== newPassword2" color="primary" depressed @click="changePassword">
                {{ $t('common.validate') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="changePasswordConfirmed">
            <v-card-text v-html="$t('pages.login.changePasswordConfirmed')"/>
            <v-card-actions>
              <v-spacer/>
              <v-btn :disabled="step === 1 && !email" color="primary" depressed @click="step='password'">
                {{ $t('common.login') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

        </v-window>

      </v-card>
      <p v-if="env.maildev">
        <br>
        <a :href="env.maildev" flat>{{ $t('pages.login.maildevLink') }}</a>
      </p>
    </v-flex>
  </v-layout>

</template>

<script>

import { mapState } from 'vuex'
import jwtDecode from 'jwt-decode'
import logo from '../components/logo.vue'
import eventBus from '../event-bus'

export default {
  components: { logo },
  data() {
    return {
      dialog: true,
      email: this.$route.query.email,
      emailErrors: [],
      step: 'email',
      stepsTitles: {
        email: this.$t('pages.login.title'),
        emailConfirmed: this.$t('common.checkInbox')
      },
      password: '',
      passwordErrors: [],
      actionToken: this.$route.query.action_token,
      newPassword: null,
      newPassword2: null,
      newPasswordErrors: []
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
      this.step = 'email'
    }
  },
  methods: {
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
        const link = await this.$axios.$post('api/auth/password', { email: this.email, password: this.password }, { params: { redirect: this.redirectUrl } })
        console.log('LINK', link)
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
        this.step = 'changePasswordConfirmed'
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
