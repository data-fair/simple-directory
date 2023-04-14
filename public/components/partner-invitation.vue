<template>
  <v-container
    v-if="payload"
    fluid
    class="pa-0"
  >
    <v-alert
      color="info"
      :value="true"
      outlined
      dense
    >
      <p>
        L'organisation {{ payload.on }} souhaite ajouter {{ payload.n }} comme partenaire avec {{ payload.e }} comme adresse de contact.
      </p>

      <p class="mb-0">
        Le nom "{{ payload.n }}" est indicatif et ne correspond pas nécessairement au libellé exact de votre organisation.
      </p>
    </v-alert>

    <template v-if="user && user.email !== payload.e">
      <p>
        Vous êtes connecté avec le compte utilisateur {{ user.name }} ({{ user.email }}). Vous pouvez vous connecter avec un autre compte ou créer un nouveau compte en cliquant sur le bouton ci-dessous.
      </p>
      <p>
        <v-btn
          v-t="'common.loginSignin'"
          :href="loginUrl(null, true, {email: payload.e})"
          depressed
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
          depressed
          color="primary"
          :href="loginUrl(null, true, {email: payload.e})"
        />
      </p>
      <p>
        Vous n'avez pas encore de compte ? Vous pouvez en créer un et vous serez redirigé vers cette page par la suite.
      </p>
      <p>
        <v-btn
          v-t="'common.signin'"
          depressed
          color="primary"
          :href="loginUrl(null, true, {email: payload.e, step: 'createUser'})"
        />
      </p>
    </template>

    <template v-if="user">
      <p v-if="user.organizations.length === 0">
        Vous n'appartenez à aucune organisation. Vous pouvez créer une nouvelle organisation et accepter l'invitation en son nom.
      </p>
      <p v-else>
        Vous pouvez accepter cette invitation au nom d'une organisation dont vous êtes administrateur, ou bien créer une nouvelle organisation et accepter l'invitation en son nom.
      </p>

      <p>
        <v-checkbox
          v-for="userOrg in user.organizations"
          :key="userOrg.id"
          :value="!!(selectedUserOrg && selectedUserOrg.id === userOrg.id)"
          color="primary"
          :label="userOrg.name"
          hide-details
          :disabled="userOrg.role !== 'admin'"
          @change="v => toggleSelectedUserOrg(userOrg, v)"
        />
        <v-checkbox
          v-model="createNewOrg"
          color="primary"
          label="créer une nouvelle organisation"
          hide-details
          @change="selectedUserOrg = null"
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
          dense
          outlined
          label="nom de la nouvelle organisation"
        >
          <template #append-outer>
            <v-btn
              depressed
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

<script>
import jwtDecode from 'jwt-decode'
import { mapState, mapActions, mapGetters } from 'vuex'
import eventBus from '../event-bus'

export default {
  data () {
    return {
      token: this.$route.query.partner_invit_token,
      createOrganizationName: '',
      selectedUserOrg: null,
      createNewOrg: false
    }
  },
  computed: {
    ...mapState('session', ['user']),
    ...mapGetters('session', ['loginUrl']),
    ...mapGetters(['mainHost']),
    payload () {
      if (!this.token) return
      return jwtDecode(this.token)
    }
  },
  mounted () {
    if (this.payload) {
      this.createOrganizationName = this.payload.n
      if (this.user && this.user.organizations.length === 0) {
        this.createNewOrg = true
      }
    }
  },
  methods: {
    ...mapActions('session', ['login']),
    async createOrga () {
      if (!this.createOrganizationName) return
      try {
        const orga = await this.$axios.$post('api/organizations', { name: this.createOrganizationName })
        this.acceptPartnerInvitation(orga)
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async acceptPartnerInvitation (org) {
      try {
        await this.$axios.$post(`/api/organizations/${this.payload.o}/partners/_accept`, { id: org.id, contactEmail: this.payload.e, token: this.token })
        await this.goToRedirect(org.id)
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    toggleSelectedUserOrg (userOrg, toggle) {
      if (toggle) this.selectedUserOrg = userOrg
      else this.selectedUserOrg = null
      this.createNewOrg = false
    },
    async goToRedirect (org) {
      let redirect = this.$route.query.redirect
      if (this.mainHost !== new URL(redirect).host) {
        redirect = await this.$get('/api/auth/site_redirect', { redirect, org })
      }
      window.location.href = redirect
    }
  }
}
</script>

<style lang="css">
.create-org-name .v-input__append-outer{
  margin-top: 2px !important;
}
</style>
