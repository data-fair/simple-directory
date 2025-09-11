<!-- eslint-disable vue/no-v-html -->
<template>
  <div v-if="user">
    <v-alert
      color="warning"
      variant="outlined"
    >
      {{ $t('pages.changeHost.msg1', {email: user.email, host, mainHost: mainPublicUrl.host}) }}
    </v-alert>
    <template v-if="sitePublic?.authMode === 'ssoBackOffice'">
      <h3 class="subheader mb-2">
        {{ $t('pages.changeHost.sso1', {mainHost: mainPublicUrl.host}) }}
      </h3>
      <p v-html="$t('pages.changeHost.sso2', {mainHost: mainPublicUrl.host, mainHostLogin: mainHostLogin})" />
    </template>
    <h3 class="subheader mb-2">
      {{ $t('pages.changeHost.solution1', {host}) }}
    </h3>
    <p>
      {{ $t('pages.changeHost.solution2', {mainHost: mainPublicUrl.host}) }}
    </p>
    <p>
      <v-checkbox
        v-model="confirmMigration"
        color="warning"
        :label="$t('pages.changeHost.confirmMigration', {host, mainHost: mainPublicUrl.host})"
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
  const changeHostToken = await $fetch(`users/${user.id}/host`, { method: 'POST', body: { host }, params: { action_token: actionToken } })
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
