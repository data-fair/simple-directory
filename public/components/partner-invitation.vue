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
    >
      <p>
        {{ $t('pages.login.partnerInvitationMsg', {organization: payload.on, partner: payload.n}) }}
      </p>
      <p class="mb-0">
        Le nom "{{ payload.n }}" est indicatif et ne correspond pas forcément exactement au libellé de votre organisation.
      </p>
    </v-alert>
    <p v-if="user && user.email !== payload.e">
      Vous êtes connecté avec le compte utilisateur {{ user.name }} ({{ user.email }}). Vous pouvez vous connecter avec un autre compte ou créer un nouveau compte en cliquant sur le bouton ci-dessous.
    </p>
    <p v-if="!user || user.email !== payload.e">
      <v-btn
        v-t="'common.loginSignin'"
        depressed
        color="primary"
        @click="login()"
      />
    </p>
    <template v-if="user">
      <p v-if="user.organizations.length === 0">
        Vous n'appartenez à aucune organisation.
      </p>
      <p>
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
import { mapState, mapActions } from 'vuex'
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
    payload () {
      if (!this.token) return
      return jwtDecode(this.token)
    }
  },
  mounted () {
    if (this.payload) {
      this.createOrganizationName = this.payload.n
    }
  },
  methods: {
    ...mapActions('session', ['login']),
    async createOrga () {
      if (!this.createOrganization.name) return
      try {
        const orga = await this.$axios.$post('api/organizations', { name: this.createOrganization.name })
        this.acceptPartnerInvitation(orga)
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    async acceptPartnerInvitation (org) {
      try {
        await this.$axios.$post(`/api/organizations/${this.payload.o}/partners/_accept`, { id: org.id, contactEmail: this.payload.e, token: this.token })
        this.$emit('accepted')
      } catch (error) {
        eventBus.$emit('notification', { error })
      }
    },
    toggleSelectedUserOrg (userOrg, toggle) {
      if (toggle) this.selectedUserOrg = userOrg
      else this.selectedUserOrg = null
      this.createNewOrg = false
    }
  }
}
</script>

<style lang="css">
.create-org-name .v-input__append-outer{
  margin-top: 2px !important;
}
</style>
