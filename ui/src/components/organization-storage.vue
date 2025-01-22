<template>
  <v-alert
    border="start"
    color="admin"
    class="my-4"
    variant="outlined"
    :icon="mdiShieldAlert"
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
      rows="20"
      :error-messages="configParsingError"
    />
    <v-row class="ma-0">
      <v-spacer />
      <v-btn
        v-if="user.adminMode"
        color="admin"
        :disabled="patch.loading.value || !diff"
        @click="patch.execute()"
      >
        Enregistrer
      </v-btn>
    </v-row>
  </v-alert>
</template>

<script setup lang="ts">
const { orga } = defineProps({
  orga: { type: Object as () => Organization, required: true }
})
const emit = defineEmits(['change'])

const { user } = useSessionAuthenticated()

const orgStorage = ref(orga.orgStorage
  ? { ...orga.orgStorage }
  : {
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
    })
const configParsingError = ref('')

const ldapConfig = computed({
  get () { return JSON.stringify(orgStorage.value.config, null, 2) },
  set (val) {
    try {
      orgStorage.value.config = JSON.parse(val)
      configParsingError.value = ''
    } catch (err: any) {
      configParsingError.value = err.message
    }
  }
})

const diff = computed(() => JSON.stringify(orga.orgStorage) !== JSON.stringify(orgStorage.value))
const loginOrg = computed(() => `${$sdUrl}/login?org=${encodeURIComponent(orga.id)}&org_storage=true&readonly=${orgStorage.value.readonly}`)
const patch = useAsyncAction(async () => {
  await $fetch(`organizations/${orga.id}`, { method: 'PATCH', body: { orgStorage: orgStorage.value } })
  emit('change')
})
</script>

<style>

</style>
