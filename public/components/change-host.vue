<template>
  <div>
    <v-alert
      color="warning"
      outlined
    >
      Le compte {{ user.email }} n'existe pas sur {{ host }}, mais il existe sur {{ mainHost }}.
    </v-alert>
    <template v-if="sitePublic.authMode === 'ssoBackOffice'">
      <h3 class="subheader mb-2">
        Solution : utiliser {{ mainHost }} pour se connecter
      </h3>
      <p>La page de login propose un bouton pour se connecter depuis {{ mainHost }} que vous pouvez utiliser. Vous pouvez aussi utiliser <a :href="mainHostLogin">ce lien.</a>.</p>
    </template>
    <template v-else>
      <h3 class="subheader mb-2">
        Solution : créer un nouveau compte sur {{ host }}
      </h3>
      <p>Vous pouvez utiliser <a :href="createAccount">ce lien.</a>.</p>
    </template>
    <h3 class="subheader mb-2">
      Solution : déplacer le compte vers {{ host }}
    </h3>
    <p>Si vous choisissez cette solution vous perdrez la possibilité de vous connecter à {{ mainHost }}.</p>
    <p>
      <v-checkbox
        v-model="confirmMigration"
        color="warning"
        :label="`déplacer le compte vers ${ host } et perdre l'accès à ${ mainHost }`"
      />
    </p>
    <v-card-actions>
      <v-spacer />
      <v-btn
        color="warning"
        depressed
        :disabled="!confirmMigration"
        @click="confirmChangeHost"
      >
        {{ $t('common.validate') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'

export default {
  props: ['user', 'actionToken'],
  data () {
    return {
      confirmMigration: false
    }
  },
  computed: {
    ...mapState(['sitePublic']),
    ...mapGetters(['host', 'mainHost']),
    createAccount () {
      return `${this.host.startsWith('localhost:') ? 'http' : 'https'}://${this.host}/simple-directory/login?step=createUser`
    },
    mainHostLogin () {
      const url = new URL(`${this.mainHost.startsWith('localhost:') ? 'http' : 'https'}://${this.mainHost}/simple-directory/login`)
      url.searchParams.append('redirect', `${this.host.startsWith('localhost:') ? 'http' : 'https'}://${this.host}`)
      return url.href
    }
  },
  methods: {
    async confirmChangeHost () {
      await this.$axios.$post(
        'api/users/' + this.user.id + '/host',
        { host: this.host },
        { params: { action_token: this.actionToken } }
      )
      this.$emit('goTo', 'login')
      this.$router.replace({ query: { ...this.$route.query, action_token: undefined } })
    }
  }
}
</script>

<style>

</style>
