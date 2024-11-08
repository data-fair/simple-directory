<template>
  <div v-if="user">
    <v-alert
      color="warning"
      variant="outlined"
    >
      Le compte {{ user.email }} n'existe pas sur {{ host }} mais il existe sur {{ mainPublicUrl.host }}.
    </v-alert>
    <template v-if="sitePublic?.authMode === 'ssoBackOffice'">
      <h3 class="subheader mb-2">
        Solution : utiliser {{ mainPublicUrl.host }} pour se connecter
      </h3>
      <p>La page de login propose un bouton pour se connecter depuis {{ mainPublicUrl.host }} que vous pouvez utiliser. Vous pouvez aussi utiliser <a :href="mainHostLogin">ce lien.</a>.</p>
    </template>
    <h3 class="subheader mb-2">
      Solution : déplacer le compte vers {{ host }}
    </h3>
    <p>Si vous choisissez cette solution vous perdrez la possibilité de vous connecter à {{ mainPublicUrl.host }}.</p>
    <p>
      <v-checkbox
        v-model="confirmMigration"
        color="warning"
        :label="`déplacer le compte vers ${ host } et perdre l'accès à ${ mainPublicUrl.host }`"
      />
    </p>
    <v-card-actions>
      <v-spacer />
      <v-btn
        color="warning"
        variant="flat"
        :disabled="!confirmMigration"
        @click="confirmChangeHost"
      >
        {{ $t('common.validate') }}
      </v-btn>
    </v-card-actions>
  </div>
</template>

<script setup lang="ts">
const { user, actionToken } = defineProps({
  user: {
    type: Object as () => ({ id: string, email: string }),
    required: true
  },
  actionToken: {
    type: String,
    required: true
  }
})
const emit = defineEmits<{ goTo: [url: string] }>()
const reactiveSearchParams = useReactiveSearchParams()

const { sitePublic, host, mainPublicUrl } = useStore()

const confirmMigration = ref(false)

const mainHostLogin = computed(() => {
  const url = new URL(`${mainPublicUrl.host.startsWith('localhost:') ? 'http' : 'https'}://${mainPublicUrl.host}/simple-directory/login`)
  url.searchParams.append('redirect', `${host.startsWith('localhost:') ? 'http' : 'https'}://${host}`)
  return url.href
})

const confirmChangeHost = withUiNotif(async () => {
  const changeHostToken = await $fetch(
    'api/users/' + user.id + '/host',
    { method: 'POST', body: { host }, params: { action_token: actionToken } }
  )
  console.log('changePasswordToken', changeHostToken)
  if (changeHostToken) {
    emit('goTo', 'changePassword')
    reactiveSearchParams.action_token = changeHostToken
  } else {
    emit('goTo', 'login')
    delete reactiveSearchParams.action_token
  }
})
</script>

<style>

</style>
