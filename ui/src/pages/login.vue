<!-- eslint-disable vue/no-v-html -->
<template>
  <v-row
    v-show="!delayedRendering"
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
        class="pa-2"
        border="lg"
      >
        <v-card-title primary-title>
          <h1 :class="{headline: true, 'mb-0': true, 'warning--text': adminMode}">
            {{ stepsTitles[step] || email }}
          </h1>
          <div
            v-if="!sitePublic"
            :class="`v-card v-sheet theme--${$vuetify.theme.current.dark ? 'dark' : 'light'} login-logo-container`"
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
                :redirect="redirect"
                :email="email"
              />
              <v-text-field
                id="email"
                v-model="email"
                density="compact"
                rounded
                variant="outlined"
                :autofocus="true"
                :label="$t('pages.login.emailLabel')"
                :error-messages="emailError"
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
                variant="flat"
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
                class="text-warning"
              >
                {{ $t('pages.login.adminMode') }}
              </p>
              <template v-if="!orgStorage && !separateEmailPasswordSteps">
                <auth-providers-login-links
                  :redirect="redirect"
                  :email="email"
                  :admin-mode="adminMode"
                />
              </template>

              <v-text-field
                id="email"
                v-model="email"
                density="compact"
                rounded
                variant="outlined"
                :autofocus="!email"
                :label="$t('pages.login.emailLabel')"
                :error-messages="emailError"
                name="email"
                class="mb-3 hide-autofill"
                hide-details="auto"
                autocomplete="email"
              />
              <p
                v-if="$uiConfig.passwordless && !adminMode"
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
                density="compact"
                rounded
                variant="outlined"
                :autofocus="!!email"
                :label="$t('common.password')"
                :error-messages="passwordError"
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
                  :error-messages="twoFAError"
                  name="2fa"
                  variant="outlined"
                  density="compact"
                  rounded
                  class="mt-4 hide-autofill"
                  hide-details="auto"
                  :autofocus="true"
                  @keyup.enter="passwordAuth"
                >
                  <template #append>
                    <v-tooltip

                      location="right"
                      max-width="400"
                    >
                      <template #activator="{props}">
                        <v-icon v-bind="props">
                          mdi-information
                        </v-icon>
                      </template>
                      <div>{{ $t('pages.login.2FAInfo') }}</div>
                    </v-tooltip>
                  </template>
                </v-text-field>
              </template>
              <v-checkbox
                v-if="!adminMode"
                id="rememberMe"
                v-model="rememberMe"
                :class="passwordError ? 'mt-0' : 'mt-1'"
                density="compact"
                :label="$t('pages.login.rememberMe')"
                hide-details
              />
              <v-row
                v-if="!readonly && !$uiConfig.onlyCreateInvited && !adminMode"
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
                variant="text"
                @click="step='preLogin'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                :disabled="!email || !password"
                :color="adminMode ? 'warning' : 'primary'"
                variant="flat"
                @click="passwordAuth"
              >
                {{ $t('common.login') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="tos">
            <v-card-text>
              <p v-html="sitePublic?.tosMessage || $t('pages.login.tosMsg', {tosUrl: $uiConfig.tosUrl})" />
              <v-checkbox
                v-model="tosAccepted"
                :label="$t('pages.login.tosConfirm')"
              />
            </v-card-text>

            <v-card-actions>
              <v-btn
                variant="text"
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                :disabled="!tosAccepted"
                color="primary"
                variant="flat"
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
                variant="outlined"
                class="mb-6"
              >
                {{ $t('pages.login.createUserInvit', {name: invitPayload.n || invitPayload.id }) }}
              </v-alert>
              <auth-providers-login-links
                :redirect="redirect"
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
                  variant="outlined"
                  density="compact"
                  rounded
                  autocomplete="email"
                  :disabled="!!invitPayload"
                />

                <v-text-field
                  v-if="!sitePublic?.reducedPersonalInfoAtCreation"
                  v-model="newUser.firstName"
                  :label="$t('common.firstName')"
                  name="firstname"
                  variant="outlined"
                  density="compact"
                  rounded
                  autocomplete="given-name"
                  @keyup.enter="createUser"
                />

                <v-text-field
                  v-if="!sitePublic?.reducedPersonalInfoAtCreation"
                  v-model="newUser.lastName"
                  :label="$t('common.lastName')"
                  name="lastname"
                  variant="outlined"
                  density="compact"
                  rounded
                  autocomplete="family-name"
                  @keyup.enter="createUser"
                />

                <v-text-field
                  id="password"
                  v-model="newUser.password"
                  :label="$t('common.password')"
                  :error-messages="createUserError"
                  :rules="[v => !!v || '']"
                  name="newUserPassword"
                  :type="showNewUserPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  variant="outlined"
                  density="compact"
                  rounded
                  @keyup.enter="createUser"
                >
                  <template #append-inner>
                    <v-icon
                      v-if="newUser.password"
                      @click="showNewUserPassword = !showNewUserPassword"
                    >
                      {{ showNewUserPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
                    </v-icon>
                  </template>
                  <template #append>
                    <v-tooltip

                      location="right"
                      max-width="400"
                    >
                      <template #activator="{props}">
                        <v-icon v-bind="props">
                          mdi-information
                        </v-icon>
                      </template>
                      <div v-html="$t('errors.malformedPassword')" />
                    </v-tooltip>
                  </template>
                </v-text-field>

                <v-text-field
                  v-model="newUserPassword2"
                  :label="$t('pages.login.newPassword2')"
                  :rules="[v => !!v || '', v => newUser.password === v || $t('errors.differentPasswords')]"
                  name="newUserPassword2"
                  :type="showNewUserPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  variant="outlined"
                  density="compact"
                  rounded
                  @keyup.enter="createUser"
                >
                  <template #append>
                    <div>
                      <v-icon style="visibility:hidden">
                        mdi-information
                      </v-icon>
                    </div>
                  </template>
                </v-text-field>
              </v-form>
            </v-card-text>

            <v-card-actions>
              <v-btn
                variant="text"
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                color="primary"
                variant="flat"
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
                variant="text"
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
                variant="text"
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
                variant="text"
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
                  :error-messages="newPasswordError"
                  :rules="[v => !!v || '']"
                  name="newPassword"
                  type="password"
                  autocomplete="new-password"
                  variant="outlined"
                  density="compact"
                  rounded
                >
                  <template #append>
                    <v-tooltip

                      location="right"
                      max-width="400"
                    >
                      <template #activator="{props}">
                        <v-icon v-bind="props">
                          mdi-information
                        </v-icon>
                      </template>
                      <div v-html="$t('errors.malformedPassword')" />
                    </v-tooltip>
                  </template>
                </v-text-field>
                <v-text-field
                  v-model="newPassword2"
                  :label="$t('pages.login.newPassword2')"
                  :rules="[v => !!v || '', v => newPassword === v || $t('errors.differentPasswords')]"
                  name="newPassword2"
                  type="password"
                  autocomplete="new-password"
                  variant="outlined"
                  density="compact"
                  rounded
                  @keyup.enter="changePassword"
                >
                  <template #append>
                    <div>
                      <v-icon style="visibility:hidden">
                        mdi-information
                      </v-icon>
                    </div>
                  </template>
                </v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                :disabled="!newPassword || newPassword !== newPassword2"
                color="primary"
                variant="flat"
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
                variant="outlined"
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
                  density="compact"
                  variant="outlined"
                  rounded
                  style="max-width: 210px;"
                  :autofocus="true"
                  @keyup.enter="validate2FA"
                />
              </template>
            </v-card-text>

            <v-card-actions>
              <v-btn
                variant="text"
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                :disabled="!configure2FACode"
                color="primary"
                variant="flat"
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
                variant="outlined"
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
                variant="text"
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
                variant="outlined"
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
                  variant="outlined"
                  density="compact"
                  rounded
                />
              </template>
            </v-card-text>

            <v-card-actions>
              <v-btn
                variant="text"
                @click="step='login'"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
              <v-btn
                v-if="createOrganization.active"
                color="primary"
                variant="flat"
                @click="createOrga"
              >
                {{ $t('common.validate') }}
              </v-btn>
              <v-btn
                v-else
                color="primary"
                variant="flat"
                :href="redirect"
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
                variant="flat"
                :href="redirect"
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
                @go-to="newStep => step = newStep"
              />
            </v-card-text>
          </v-window-item>

          <v-window-item value="error">
            <v-card-text v-if="error">
              <v-alert
                :value="true"
                type="error"
                variant="outlined"
              >
                {{ $te('errors.' + error) ? $t('errors.' + error) : error }}
              </v-alert>
            </v-card-text>

            <v-card-actions>
              <v-btn
                variant="text"
                @click="clearError"
              >
                {{ $t('common.back') }}
              </v-btn>
              <v-spacer />
            </v-card-actions>
          </v-window-item>
        </v-window>
      </v-card>
      <p v-if="$uiConfig.maildev.active">
        <br>
        <a
          :href="$uiConfig.maildev.url"
          text
        >{{ $t('pages.login.maildevLink') }}</a>
      </p>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { ActionPayload, ShortenedInvitation } from '#api/types'
import { jwtDecode } from 'jwt-decode'
import type { VForm } from 'vuetify/components'
import type { PostUserReq } from '#api/doc/users/post-req/index.ts'
import type { PatchUserReq } from '#api/doc/users/patch-req/index.ts'
import type { PostOrganizationReq } from '#api/doc/organizations/post-req/index.ts'
import type { PostPasswordlessAuthReq } from '#api/doc/auth/post-passwordless-req/index.ts'
import type { PostPasswordAuthReq } from '#api/doc/auth/post-password-req/index.ts'
import type { PostActionAuthReq } from '#api/doc/auth/post-action-req/index.ts'

const reactiveSearchParams = useReactiveSearchParams()
const { t } = useI18n()
const { user, switchOrganization } = useSession()
const { sendUiNotif } = useUiNotif()
const { authProvidersFetch, sitePublic } = useStore()

const error = useStringSearchParam('error')
const plannedDeletion = reactiveSearchParams.planned_deletion
const adminMode = useBooleanSearchParam('adminMode')
let orgId = reactiveSearchParams.org as string | undefined
let depId = reactiveSearchParams.dep as string | undefined
const readonly = $uiConfig.readonly || useBooleanSearchParam('readonly').value
const redirect = reactiveSearchParams.redirect

const email = ref<string>(reactiveSearchParams.email ?? '')
const emailError = ref<string | null>(null)
const password = ref('')
const passwordError = ref<string | null>(null)
const orgStorage = useBooleanSearchParam('org_storage')
const membersOnly = useBooleanSearchParam('members_only')
const rememberMe = ref(true)

const newPassword = ref('')
const newPassword2 = ref('')
const newPasswordError = ref<string | null>(null)

const newUser = ref({ firstName: '', lastName: '', password: '' })
const newUserPassword2 = ref('')
const showNewUserPassword = ref(false)
const createUserError = ref<string | null>(null)
const tosAccepted = ref(false)
const createOrganization = ref({ active: false, name: '' })

const qrcode = ref('')
const configure2FACode = ref('')
const twoFARequired = ref(false)
const twoFACode = ref('')
const recovery = ref('')
const twoFAError = ref<string | null>(null)

const invitToken = reactiveSearchParams.invit_token
const invitPayload = invitToken ? jwtDecode(invitToken) as ShortenedInvitation : null

const actionToken = useStringSearchParam('action_token')
const actionPayload = actionToken.value ? jwtDecode(actionToken.value) as ActionPayload : null

const logoUrl = computed(() => {
  if (reactiveSearchParams.logo) return reactiveSearchParams.logo
  if (sitePublic.value?.logo) return sitePublic.value?.logo
  if (orgId) return `${$sdUrl}/api/avatars/organization/${orgId}/avatar.png`
  if ($uiConfig.theme.logo) return $uiConfig.theme.logo
  return null
})

const stepsTitles: Record<string, string> = {
  preLogin: t('pages.login.title'),
  login: t('pages.login.title'),
  emailConfirmed: t('common.checkInbox'),
  createUser: t('pages.login.createUserMsg2'),
  createUserConfirmed: t('pages.login.createUserConfirm'),
  changePasswordSent: t('pages.login.changePassword'),
  error: t('pages.login.error'),
  configure2FA: t('pages.login.configure2FA'),
  recovery2FA: t('pages.login.recovery2FA'),
  createOrga: t('common.createOrganization'),
  plannedDeletion: t('pages.login.plannedDeletion'),
  partnerInvitation: t('pages.login.partnerInvitation'),
  changeHost: t('pages.login.changeHost')
}
const createUserStep = () => {
  step.value = $uiConfig.tosUrl ? 'tos' : 'createUser'
}
const step = ref<string>(reactiveSearchParams.step ?? 'login')
if (actionPayload && actionPayload.action === 'changePassword') {
  step.value = 'changePassword'
  email.value = actionPayload.email
} if (actionPayload && actionPayload.action === 'changeHost') {
  step.value = 'changeHost'
  email.value = actionPayload.email
} else if (invitPayload) {
  createUserStep()
  orgId = invitPayload.id
  depId = invitPayload.d
  email.value = invitPayload.e
} else if (plannedDeletion) {
  step.value = 'plannedDeletion'
}
if (error.value) {
  step.value = 'error'
}

const separateEmailPasswordSteps = computed(() => {
  return !!authProvidersFetch.data.value?.find(p => p.redirectMode?.type === 'emailDomain')
})
if (step.value === 'login') {
  authProvidersFetch.refresh()
  watch(separateEmailPasswordSteps, (value) => {
    if (value) step.value = 'preLogin'
  })
}

const delayedRendering = computed(() => {
  // step is not login, render immediately
  if (step.value !== 'login') return false
  // we have to wait for auth providers
  if (!authProvidersFetch.data.value) return true
  // we have to wait for the redirection to be done by auth-providers-login-links.vue
  if (authProvidersFetch.data.value.find(p => p.redirectMode?.type === 'always')) return true
  return false
})

function preLogin () {
  if (!authProvidersFetch.data.value) return
  const authProvider = authProvidersFetch.data.value.find(p => p.redirectMode?.type === 'emailDomain' && p.redirectMode.emailDomain === email.value.trim().split('@')[1])
  if (authProvider) {
    const url = new URL(`${$sdUrl}/api/auth/${authProvider.type}/${authProvider.id}/login`)
    if (redirect) url.searchParams.append('redirect', redirect)
    if (email.value) url.searchParams.append('email', email.value)
    if (invitToken) url.searchParams.append('invit_token', invitToken)
    window.location.href = url.href
  } else {
    step.value = 'login'
  }
}

const createUserForm = ref<InstanceType<typeof VForm>>()
async function createUser () {
  if (!createUserForm.value?.validate()) return
  try {
    const body: PostUserReq['body'] = { email: email.value, ...newUser.value }
    const link = await $fetch('api/users', {
      method: 'POST',
      body,
      params: {
        redirect,
        org: orgId,
        dep: depId,
        invit_token: invitToken
      }
    })
    createUserError.value = null
    password.value = newUser.value.password
    if (invitToken) window.location.href = link
    else step.value = 'createUserConfirmed'
  } catch (error: any) {
    if (error.status && error.status < 500) {
      createUserError.value = error.data ?? error.statusMessage ?? error.message as string
    } else {
      sendUiNotif(error)
    }
  }
}

async function createOrga () {
  if (!createOrganization.value.name) return
  if (!user.value) return
  try {
    const body: PostOrganizationReq['body'] = { name: createOrganization.value.name }
    const orga = await $fetch('api/organizations', { method: 'POST', body })
    const userPatch: PatchUserReq['body'] = { ignorePersonalAccount: true, defaultOrg: orga.id }
    await $fetch('api/users/' + user.value.id, { method: 'PATCH', body: userPatch })
    switchOrganization(orga.id)
    goToRedirect()
  } catch (error: any) {
    if (error.status && error.status < 500) {
      createUserError.value = error.data ?? error.statusMessage ?? error.message as string
    } else {
      sendUiNotif(error)
    }
  }
}

async function passwordlessAuth () {
  emailError.value = null
  try {
    const body: PostPasswordlessAuthReq['body'] = {
      email: email.value,
      rememberMe: rememberMe.value,
      org: orgId,
      dep: depId,
      membersOnly: membersOnly.value,
      orgStorage: orgStorage.value
    }
    await $fetch('api/auth/passwordless', { method: 'POST', body, params: { redirect } })
    step.value = 'emailConfirmed'
  } catch (error: any) {
    if (error.status && error.status < 500) {
      emailError.value = error.data ?? error.statusMessage ?? error.message as string
    } else {
      sendUiNotif(error)
    }
  }
}

async function passwordAuth () {
  emailError.value = null
  try {
    const body: PostPasswordAuthReq['body'] = {
      email: email.value,
      password: password.value,
      adminMode: adminMode.value,
      rememberMe: rememberMe.value && !adminMode.value,
      org: orgId,
      dep: depId,
      '2fa': twoFACode.value,
      membersOnly: membersOnly.value,
      orgStorage: orgStorage.value
    }
    const link = await $fetch('api/auth/password', { method: 'POST', body, params: { redirect } })
    window.location.href = link
  } catch (error: any) {
    if (error.status && error.status < 500) {
      if (error.data === '2fa-missing') {
        step.value = 'configure2FA'
        passwordError.value = null
        init2FA()
      } else if (error.data === '2fa-required') {
        passwordError.value = null
        twoFARequired.value = true
        twoFAError.value = null
      } else if (error.data === '2fa-bad-token') {
        passwordError.value = null
        twoFAError.value = t('errors.bad2FAToken')
      } else {
        passwordError.value = error.data ?? error.statusMessage ?? error.message as string
        twoFAError.value = null
      }
    } else {
      sendUiNotif(error)
    }
  }
}

const changePasswordAction = withUiNotif(async () => {
  const body: PostActionAuthReq['body'] = {
    email: email.value,
    action: 'changePassword',
    redirect: window.location.href
  }
  await $fetch('api/auth/action', { method: 'POST', body })
  step.value = 'changePasswordSent'
})

const changePasswordForm = ref<InstanceType<typeof VForm>>()
async function changePassword () {
  if (!actionPayload || !changePasswordForm.value?.validate()) return
  try {
    await $fetch(`api/users/${actionPayload.id}/password`, {
      method: 'POST',
      body: { password: newPassword.value },
      params: { action_token: actionToken.value }
    })
    password.value = newPassword.value
    step.value = 'login'
    actionToken.value = ''
  } catch (error: any) {
    if (error.status && error.status < 500) {
      newPasswordError.value = error.data ?? error.statusMessage ?? error.message as string
    } else {
      sendUiNotif(error)
    }
  }
}

const init2FA = withUiNotif(async () => {
  // initialize secret
  const res = await $fetch('api/2fa', {
    method: 'POST',
    body: {
      email: email.value,
      password: password.value
    }
  })
  qrcode.value = res.qrcode
  configure2FACode.value = ''
})

const validate2FA = withUiNotif(async () => {
  // validate secret with initial token
  const res = await $fetch('api/2fa', {
    method: 'POST',
    body: {
      email: email.value,
      password: password.value,
      token: configure2FACode.value
    }
  })
  configure2FACode.value = ''
  recovery.value = res.recovery
  step.value = 'recovery2FA'
  twoFARequired.value = true
})

function downloadRecovery () {
  const element = document.createElement('a')
  const contentHeader = t('recovery2FAContent', { name: `${window.location.host}` })
  const content = `${contentHeader}

${recovery.value}`
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
  element.setAttribute('download', window.location.host.replace(/\./g, '-') + '-2fa-recovery.txt')
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

function clearError () {
  error.value = ''
  window.location.reload()
}

function goToRedirect () {
  window.location.href = redirect
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
