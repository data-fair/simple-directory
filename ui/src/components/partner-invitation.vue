<template>
  <v-container
    v-if="invit"
    fluid
    class="pa-0"
  >
    <v-alert
      color="info"
      :value="true"
      variant="outlined"
      density="compact"
    >
      <p>
        L'organisation {{ invit.on }} souhaite ajouter {{ invit.n }} comme partenaire avec {{ invit.e }} comme adresse de contact.
      </p>

      <p class="mb-0">
        Le nom "{{ invit.n }}" est indicatif et ne correspond pas nécessairement au libellé exact de votre organisation.
      </p>
    </v-alert>

    <template v-if="user && user.email !== invit.e">
      <p>
        Vous êtes connecté avec le compte utilisateur {{ user.name }} ({{ user.email }}). Vous pouvez vous connecter avec un autre compte ou créer un nouveau compte en cliquant sur le bouton ci-dessous.
      </p>
      <p>
        <v-btn
          v-t="'common.loginSignin'"
          :href="loginUrl(undefined, {email: invit.e})"
          variant="flat"
          color="primary"
        />
      </p>
    </template>

    <template v-if="!user">
      <p>
        Vous avez déjà un compte ? Vous pouvez vous connecter et vous serez redirigé vers cette page par la suite.
      </p>
      <p>
        <v-btn
          v-t="'common.login'"
          variant="flat"
          color="primary"
          :href="loginUrl(undefined, {email: invit.e})"
        />
      </p>
      <p>
        Vous n'avez pas encore de compte ? Vous pouvez en créer un et vous serez redirigé vers cette page par la suite.
      </p>
      <p>
        <v-btn
          v-t="'common.signin'"
          variant="flat"
          color="primary"
          :href="loginUrl(undefined, {email: invit.e, step: 'createUser'})"
        />
      </p>
    </template>

    <template v-if="user">
      <p v-if="otherUserOrgs.length === 0">
        Vous n'appartenez à aucune organisation. Vous pouvez créer une nouvelle organisation et accepter l'invitation en son nom.
      </p>
      <p v-else>
        Vous pouvez accepter cette invitation au nom d'une organisation dont vous êtes administrateur, ou bien créer une nouvelle organisation et accepter l'invitation en son nom.
      </p>

      <p>
        <v-checkbox
          v-for="userOrg in otherUserOrgs"
          :key="userOrg.id"
          :value="!!(selectedUserOrg && selectedUserOrg.id === userOrg.id)"
          color="primary"
          :label="userOrg.name"
          hide-details
          :disabled="userOrg.role !== 'admin'"
          @update:model-value="v => toggleSelectedUserOrg(userOrg, v as boolean)"
        />
        <v-checkbox
          v-model="createNewOrg"
          color="primary"
          label="créer une nouvelle organisation"
          hide-details
          @update:model-value="selectedUserOrg = null"
        />
      </p>
      <p v-if="selectedUserOrg">
        <v-btn
          color="primary"
          @click="acceptPartnerInvitation(selectedUserOrg)"
        >
          accepter au nom de {{ selectedUserOrg.name }}
        </v-btn>
      </p>
      <p v-if="createNewOrg">
        <v-text-field
          v-model="createOrganizationName"
          class="create-org-name"
          density="compact"
          variant="outlined"
          label="nom de la nouvelle organisation"
        >
          <template #append>
            <v-btn
              variant="flat"
              color="primary"
              @click="createOrga"
            >
              créer
            </v-btn>
          </template>
        </v-text-field>
      </p>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { type OrganizationMembership } from '@data-fair/lib-common-types/session/index.js'
import { type Organization, type ShortenedPartnerInvitation } from '#api/types'
import { jwtDecode } from 'jwt-decode'

const reactiveSearchParams = useReactiveSearchParams()
const { user, loginUrl } = useSessionAuthenticated()
const { mainPublicUrl } = useStore()

const createOrganizationName = ref('')
const selectedUserOrg = ref<OrganizationMembership | null>(null)
const createNewOrg = ref(false)

const token = reactiveSearchParams.partner_invit_token
const invit = token ? jwtDecode(token) as ShortenedPartnerInvitation : undefined
const otherUserOrgs = computed(() => {
  if (!invit) return []
  return user.value.organizations.filter(o => invit.o !== o.id)
})
if (invit) {
  createOrganizationName.value = invit.n
  if (otherUserOrgs.value.length === 0) createNewOrg.value = true
}

const createOrga = withUiNotif(async () => {
  if (!createOrganizationName.value) return
  const orga = await $fetch<Organization>('api/organizations', { method: 'POST', body: { name: createOrganizationName.value } })
  if (!user.value.organizations.length) {
    await $fetch('users/' + user.value.id, { body: { defaultOrg: orga.id, ignorePersonalAccount: true } })
  }
  acceptPartnerInvitation(orga)
})

const acceptPartnerInvitation = withUiNotif(async (org: Organization) => {
  if (!invit) return
  await $fetch(`/api/organizations/${invit.o}/partners/_accept`, { method: 'POST', body: { id: org.id, contactEmail: invit.e, token } })
  goToRedirect(org.id)
})

const toggleSelectedUserOrg = (userOrg: OrganizationMembership, toggle: boolean) => {
  if (toggle) selectedUserOrg.value = userOrg
  else selectedUserOrg.value = null
  createNewOrg.value = false
}

const goToRedirect = withUiNotif(async (org: string) => {
  let redirect = reactiveSearchParams.redirect
  if (mainPublicUrl.host !== new URL(redirect).host) {
    redirect = await $fetch('/api/auth/site_redirect', { method: 'POST', body: { redirect, org } })
  }
  window.location.href = redirect
})

</script>

<style lang="css">
.create-org-name .v-input__append{
  margin-top: 2px !important;
}
</style>
