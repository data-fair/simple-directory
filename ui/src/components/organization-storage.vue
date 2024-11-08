<template>
  <v-alert
    border="start"
    colored-border
    color="admin"
    class="my-4"
    icon="mdi-shield-alert"
  >
    <v-switch
      v-model="orgStorage.active"
      label="Activer le stockage secondaire d'utilisateurs"
      class="mt-0"
      color="admin"
      hide-details
      :disabled="!user.adminMode"
    />
    <div
      v-if="orgStorage.active"
      class="py-3"
    >
      <a
        :href="loginOrg"
        target="top"
      >Lien de connexion pour utiliser ce stockage secondaire</a>
    </div>
    <v-textarea
      v-if="orgStorage.active && user.adminMode"
      v-model="ldapConfig"
      label="Configuration LDAP"
      :error-messages="configParsingError"
    />
    <v-btn
      v-if="diff"
      color="admin"
      dark
      @click="patch"
    >
      Entregistrer
    </v-btn>
  </v-alert>
</template>

<script setup lang="ts">
import { mapState } from 'vuex'
export default {
  props: ['orga'],
  data () {
    return {
      orgStorage: null,
      configParsingError: null
    }
  },
  computed: {
    ...mapState(['env']),
    ...mapState('session', ['user']),
    ldapConfig: {
      get () { return JSON.stringify(this.orgStorage.config, null, 2) },
      set (val) {
        try {
          this.orgStorage.config = JSON.parse(val)
          this.configParsingError = null
        } catch (err) {
          this.configParsingError = err.message
        }
      }
    },
    diff () {
      if (!this.orga || !this.orga.orgStorage || !this.orgStorage) return false
      if (!this.orga.orgStorage.active && !this.orgStorage.active) return false
      return JSON.stringify(this.orga.orgStorage) !== JSON.stringify(this.orgStorage)
    },
    loginOrg () {
      return `${this.$sdUrl}/login?org=${encodeURIComponent(this.orga.id)}&org_storage=true&readonly=${this.orgStorage.readonly}`
    }
  },
  created () {
    // eslint-disable-next-line vue/no-mutating-props
    this.orga.orgStorage = this.orga.orgStorage || {
      active: false,
      type: 'ldap',
      readonly: true,
      config: {
        url: 'ldap://ldap:389',
        searchUserDN: 'cn=admin,dc=example,dc=org',
        searchUserPassword: '',
        baseDN: 'dc=example,dc=org',
        users: {
          objectClass: 'inetOrgPerson',
          dnKey: 'cn',
          mapping: {
            id: 'cn',
            name: 'cn',
            email: 'mail',
            firstName: 'givenName',
            lastName: 'sn',
            birthday: null,
            avatarUrl: null
          }
        },
        members: {
          onlyWithRole: false,
          role: {
            attr: 'employeeType',
            values: {
              admin: ['admin'],
              user: []
            },
            default: 'user'
          }
        }
      }
    }
    this.orgStorage = JSON.parse(JSON.stringify(this.orga.orgStorage))
  },
  methods: {
    async patch () {
      await this.$axios.$patch(`/api/organizations/${this.orga.id}`, { orgStorage: this.orgStorage })
      // eslint-disable-next-line vue/no-mutating-props
      this.orga.orgStorage = this.orgStorage
    }
  }
}
</script>

<style>

</style>
