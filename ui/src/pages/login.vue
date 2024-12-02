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
        <v-col cols="auto">
          <img
            v-if="logoUrl"
            :src="logoUrl"
            style="max-width:250px;max-height:120px;"
            @alt="$t('pages.login.siteLogo')"
          >
          <logo
            v-else
            style="height:100px"
          />
        </v-col>
      </v-row>
      <v-card
        class="pa-2"
        border="sm"
        rounded="xl"
        elevation="3"
      >
        <v-card-title
          class="text-subtitle-2"
          style="white-space: normal;"
        >
          <h1 :class="{'mb-0': true, 'text-admin': adminMode}">
            {{ stepsTitles[step] || email }}
          </h1>
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
                density="comfortable"
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
                class="text-warning mb-6"
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

              <v-form>
                <ui-notif-alert
                  :notif="passwordAuth.notif.value ?? changePasswordAction.notif.value ?? passwordlessAuth.notif.value"
                  :alert-props="{variant: 'text', class: 'pt-0'}"
                />

                <v-text-field
                  id="email"
                  v-model="email"
                  density="comfortable"
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
                    @click="passwordlessAuth.execute()"
                    @keyup.enter="passwordlessAuth.execute()"
                  >{{ $t('pages.login.passwordlessMsg2') }}</a>
                </p>

                <v-text-field
                  id="password"
                  v-model="password"
                  density="comfortable"
                  rounded
                  variant="outlined"
                  :autofocus="!!email"
                  :label="$t('common.password')"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  class="mt-4 hide-autofill"
                  hide-details="auto"
                  @keyup.enter="passwordAuth.execute()"
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
                    @keyup.enter="passwordAuth.execute()"
                  >
                    <template #append>
                      <v-tooltip

                        location="right"
                        max-width="400"
                      >
                        <template #activator="{props}">
                          <v-icon
                            v-bind="props"
                            color="info"
                            :icon="mdiInformation"
                          />
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
                  density="comfortable"
                  :label="$t('pages.login.rememberMe')"
                  hide-details
                  color="primary"
                />
              </v-form>
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
                    @click="changePasswordAction.execute()"
                    @keyup.enter="passwordAuth.execute()"
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
                :disabled="!email || !password || passwordAuth.loading.value"
                :color="adminMode ? 'admin' : 'primary'"
                variant="flat"
                @click="passwordAuth.execute()"
              >
                {{ $t('common.login') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="tos">
            <v-card-text>
              <p
                class="mb-3"
                v-html="sitePublic?.tosMessage || $t('pages.login.tosMsg', {tosUrl: $uiConfig.tosUrl})"
              />
              <v-checkbox
                v-model="tosAccepted"
                :label="$t('pages.login.tosConfirm')"
                color="primary"
                hide-details
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
                <ui-notif-alert
                  :notif="createUser.notif.value"
                  :alert-props="{variant:'text'}"
                />
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
                  @keyup.enter="createUser.execute()"
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
                  @keyup.enter="createUser.execute()"
                />

                <v-text-field
                  id="password"
                  v-model="newUser.password"
                  :label="$t('common.password')"
                  :rules="[v => !!v || '']"
                  name="newUserPassword"
                  :type="showNewUserPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  variant="outlined"
                  density="compact"
                  rounded
                  @keyup.enter="createUser.execute()"
                >
                  <template #append-inner>
                    <v-icon
                      v-if="newUser.password"
                      :icon="showNewUserPassword ? mdiEyeOffOutline : mdiEyeOutline"
                      @click="showNewUserPassword = !showNewUserPassword"
                    />
                  </template>
                  <template #append>
                    <v-tooltip

                      location="right"
                      max-width="400"
                    >
                      <template #activator="{props}">
                        <v-icon
                          v-bind="props"
                          color="info"
                          :icon="mdiInformation"
                        />
                      </template>
                      <div v-html="$t('errors.malformedPassword')" />
                    </v-tooltip>
                  </template>
                </v-text-field>

                <v-text-field
                  v-model="newUserPassword2"
                  :label="$t('pages.login.newPassword2')"
                  :rules="[v => !!v || '']"
                  :error-messages="newUserPassword2Errors"
                  name="newUserPassword2"
                  :type="showNewUserPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  variant="outlined"
                  density="compact"
                  rounded
                  @keyup.enter="createUser.execute()"
                >
                  <template #append>
                    <div>
                      <v-icon
                        style="visibility:hidden"
                        color="info"
                        :icon="mdiInformation"
                      />
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
                :disabled="createUser.loading.value"
                @click="createUser.execute()"
              >
                {{ $t('pages.login.createUserConfirm') }}
              </v-btn>
            </v-card-actions>
          </v-window-item>

          <v-window-item value="createUserConfirmed">
            <v-card-text>
              <p class="mb-2">
                {{ $t('pages.login.createUserConfirmed', {email}) }}
              </p>
              <p class="mb-2 text-caption">
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
              <p class="mb-2">
                {{ $t('pages.login.passwordlessConfirmed', {email}) }}
              </p>
              <p class="mb-2 text-caption">
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
              <p class="mb-2">
                {{ $t('pages.login.changePasswordSent', {email}) }}
              </p>
              <p class="mb-2 text-caption">
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
                <p class="mb-6">
                  {{ $t('pages.login.newPasswordMsg') }}
                </p>

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
                  :rules="[v => !!v || '']"
                  name="newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  variant="outlined"
                  density="compact"
                  rounded
                  class="mb-2"
                >
                  <template #append-inner>
                    <v-icon
                      v-if="newPassword"
                      :icon="showNewPassword ? mdiEyeOffOutline : mdiEyeOutline"
                      @click="showNewPassword = !showNewPassword"
                    />
                  </template>
                  <template #append>
                    <v-tooltip
                      location="right"
                      max-width="400"
                    >
                      <template #activator="{props}">
                        <v-icon
                          v-bind="props"
                          color="info"
                          :icon="mdiInformation"
                        />
                      </template>
                      <div v-html="$t('errors.malformedPassword')" />
                    </v-tooltip>
                  </template>
                </v-text-field>
                <v-text-field
                  v-model="newPassword2"
                  :label="$t('pages.login.newPassword2')"
                  :error-messages="newPassword2Error"
                  name="newPassword2"
                  :type="showNewPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  variant="outlined"
                  density="compact"
                  rounded
                  @keyup.enter="changePassword.execute()"
                >
                  <template #append>
                    <div>
                      <v-icon
                        style="visibility:hidden"
                        color="info"
                        :icon="mdiInformation"
                      />
                    </div>
                  </template>
                </v-text-field>

                <ui-notif-alert
                  :notif="changePassword.notif.value ?? changePassword.notif.value"
                  :alert-props="{variant: 'text'}"
                />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                :disabled="!newPassword || newPassword !== newPassword2"
                color="primary"
                variant="flat"
                @click="changePassword.execute()"
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

              <p class="mb-2">
                {{ $t('pages.login.recovery2FACode') }}
                <br>
                {{ recovery }}
                <v-btn
                  :title="$t('pages.login.recovery2FADownload')"
                  variant="text"
                  class="mx-0"
                  color="warning"
                  :icon="mdiDownload"
                  @click="downloadRecovery"
                />
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

              <ui-notif-alert
                :notif="createOrga.notif.value"
                :alert-props="{variant:'text'}"
              />

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
                @click="createOrga.execute()"
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
                v-if="actionPayload"
                :user="actionPayload"
                :action-token="actionToken"
                @go-to="(newStep: string) => step = newStep"
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
      <p
        v-if="$uiConfig.maildev.active"
        class="mt-2"
      >
        <a :href="$uiConfig.maildev.url">{{ $t('pages.login.maildevLink') }}</a>
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
import UiNotifAlert from '@data-fair/lib-vuetify/ui-notif-alert.vue'

const reactiveSearchParams = useReactiveSearchParams()
const { t } = useI18n()
const { user, switchOrganization } = useSession()
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

const orgStorage = useBooleanSearchParam('org_storage')
const membersOnly = useBooleanSearchParam('members_only')
const rememberMe = ref(true)

const showNewPassword = ref(false)
const newPassword = ref('')
const newPassword2 = ref('')
const newPassword2Error = computed(() => {
  if (!newPassword2.value) return ''
  if (newPassword.value !== newPassword2.value) return t('errors.differentPasswords')
})

const newUser = ref({ firstName: '', lastName: '', password: '' })
const newUserPassword2 = ref('')
const newUserPassword2Errors = computed(() => {
  if (!newUserPassword2.value) return ''
  if (newUser.value.password !== newUserPassword2.value) return t('errors.differentPasswords')
})

const showNewUserPassword = ref(false)
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

watch(step, () => {
  if (step.value === 'login' && !authProvidersFetch.data.value) {
    authProvidersFetch.refresh()
  }
}, { immediate: true })
const separateEmailPasswordSteps = computed(() => {
  return !!authProvidersFetch.data.value?.find(p => p.redirectMode?.type === 'emailDomain')
})
watch(separateEmailPasswordSteps, (value) => {
  if (value) step.value = 'preLogin'
})

if (sitePublic.value?.authMode === 'onlyBackOffice') {
  const mainLoginUrl = new URL(window.location.href)
  mainLoginUrl.host = mainPublicUrl.host
  window.location.replace(mainLoginUrl.href)
}
if (sitePublic.value?.authMode === 'onlyOtherSite' && sitePublic.value?.authOnlyOtherSite) {
  const otherSiteLoginUrl = new URL(window.location.href)
  otherSiteLoginUrl.host = sitePublic.value?.authOnlyOtherSite
  window.location.replace(otherSiteLoginUrl.href)
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
const createUser = useAsyncAction(async () => {
  await createUserForm.value?.validate()
  if (!createUserForm.value?.isValid) return
  const body: PostUserReq['body'] = { email: email.value, ...newUser.value }
  const link = await $fetch('users', {
    method: 'POST',
    body,
    params: {
      redirect,
      org: orgId,
      dep: depId,
      invit_token: invitToken
    }
  })
  password.value = newUser.value.password
  if (invitToken) window.location.href = link
  else step.value = 'createUserConfirmed'
}, { catch: 'all' })

const createOrga = useAsyncAction(async () => {
  if (!createOrganization.value.name) return
  if (!user.value) return
  const body: PostOrganizationReq['body'] = { name: createOrganization.value.name }
  const orga = await $fetch('organizations', { method: 'POST', body })
  const userPatch: PatchUserReq['body'] = { ignorePersonalAccount: true, defaultOrg: orga.id }
  await $fetch('users/' + user.value.id, { method: 'PATCH', body: userPatch })
  switchOrganization(orga.id)
  goToRedirect()
}, { catch: 'all' })

const passwordlessAuth = useAsyncAction(async () => {
  emailError.value = null
  const body: PostPasswordlessAuthReq['body'] = {
    email: email.value,
    rememberMe: rememberMe.value,
    org: orgId,
    dep: depId,
    membersOnly: membersOnly.value,
    orgStorage: orgStorage.value
  }
  await $fetch('auth/passwordless', { method: 'POST', body, params: { redirect } })
  step.value = 'emailConfirmed'
}, { catch: 'all' })

const passwordAuth = useAsyncAction(async () => {
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
    const link = await $fetch('auth/password', { method: 'POST', body, params: { redirect } })
    window.location.href = link
  } catch (error: any) {
    if (error.status && error.status < 500) {
      if (error.data === '2fa-missing') {
        step.value = 'configure2FA'
        init2FA()
      } else if (error.data === '2fa-required') {
        twoFARequired.value = true
        twoFAError.value = null
      } else if (error.data === '2fa-bad-token') {
        twoFAError.value = t('errors.bad2FAToken')
      } else {
        twoFAError.value = null
        throw error
      }
    } else {
      throw error
    }
  }
}, { catch: 'all' })
watch(() => email.value + password.value, () => { passwordAuth.notif.value = undefined })

const changePasswordAction = useAsyncAction(async () => {
  const body: PostActionAuthReq['body'] = {
    email: email.value,
    action: 'changePassword',
    target: window.location.href
  }
  await $fetch('auth/action', { method: 'POST', body })
  step.value = 'changePasswordSent'
}, { catch: 'all' })
watch(email, () => { changePasswordAction.notif.value = undefined })

const changePasswordForm = ref<InstanceType<typeof VForm>>()
const changePassword = useAsyncAction(async () => {
  if (!actionPayload) return
  await changePasswordForm.value?.validate()
  if (!changePasswordForm.value?.isValid) return
  await $fetch(`users/${actionPayload.id}/password`, {
    method: 'POST',
    body: { password: newPassword.value },
    params: { action_token: actionToken.value }
  })
  password.value = newPassword.value
  step.value = 'login'
  actionToken.value = ''
}, { catch: 'all' })
watch(newPassword, () => { changePassword.notif.value = undefined })

const init2FA = withUiNotif(async () => {
  // initialize secret
  const res = await $fetch('2fa', {
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
  const res = await $fetch('2fa', {
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
