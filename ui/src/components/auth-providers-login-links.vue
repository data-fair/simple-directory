<template>
  <v-row
    v-if="authProvidersFetch.data.value"
    class="mb-6 mx-0"
  >
    <v-btn
      v-if="sitePublic && sitePublic.authMode === 'ssoBackOffice'"
      :color="$uiConfig.theme.colors.primary"
      :href="mainSiteLoginUrl"
      size="small"
      rounded
      variant="flat"
      class="pl-0 pr-3 mr-2 mb-1 text-none text-white"
    >
      <v-avatar
        size="28"
        color="white"
        class="elevation-1"
        style="left:-1px"
      >
        <img
          v-if="$uiConfig.theme.logo"
          :src="$uiConfig.theme.logo"
        >
        <logo v-else />
      </v-avatar>
      &nbsp;{{ mainPublicUrl.host }}
    </v-btn>
    <v-btn
      v-for="authProvider of authProvidersFetch.data.value.filter(p => !p.redirectMode || p.redirectMode.type === 'button')"
      :key="authProvider.type + ':' + authProvider.id"
      :color="authProvider.color"
      :href="providerLoginUrl(authProvider)"
      size="small"
      rounded
      variant="flat"
      class="pl-0 pr-3 mr-2 mb-1 text-none text-white"
    >
      <v-avatar
        size="27"
        color="white"
        class="elevation-4"
        style="left:-1px; top: -1px;"
      >
        <v-icon
          v-if="authProvider.icon"
          :color="authProvider.color"
        >
          {{ authProvider.icon }}
        </v-icon>
        <img
          v-else-if="authProvider.img"
          :src="authProvider.img"
          :alt="authProvider.title"
        >
      </v-avatar>
      &nbsp;{{ authProvider.title }}
    </v-btn>
  </v-row>
</template>

<script lang="ts" setup>
import { PublicAuthProvider } from '#api/types'

const { authProvidersFetch, sitePublic, mainPublicUrl } = useStore()

const { redirect, email, invitToken, adminMode } = defineProps({
  redirect: { type: String, required: true },
  email: { type: String, required: true },
  invitToken: { type: String, required: true },
  adminMode: { type: Boolean, required: true }
})

const mainSiteLoginUrl = siteLoginUrl(mainPublicUrl.host)

watch(authProvidersFetch.data, (providers) => {
  const alwaysRedirectProvider = providers?.find(p => p.redirectMode?.type === 'always')
  if (alwaysRedirectProvider) {
    window.location.href = providerLoginUrl(alwaysRedirectProvider)
  }
}, { immediate: true })

function providerLoginUrl (authProvider: PublicAuthProvider) {
  if (authProvider.type === 'otherSite' && authProvider.host) {
    return siteLoginUrl(authProvider.host)
  }
  let sdUrl = $sdUrl
  if (authProvider.type === 'otherSiteProvider' && authProvider.host) {
    sdUrl = `${authProvider.host.startsWith('localhost:') ? 'http' : 'https'}://${authProvider.host}/simple-directory`
  }
  const url = new URL(`${sdUrl}/api/auth/${authProvider.type}/${authProvider.id}/login`)
  if (redirect) url.searchParams.append('redirect', redirect)
  if (email) url.searchParams.append('email', email)
  if (invitToken) url.searchParams.append('invit_token', invitToken)
  if (adminMode) url.searchParams.append('adminMode', 'true')
  return url.href
}

function siteLoginUrl (host: string) {
  const url = new URL(`${host.startsWith('localhost:') ? 'http' : 'https'}://${host}/simple-directory/login`)
  if (redirect) url.searchParams.append('redirect', redirect)
  if (email) url.searchParams.append('email', email)
  if (invitToken) url.searchParams.append('invit_token', invitToken)
  if (adminMode) url.searchParams.append('adminMode', 'true')
  return url.href
}
</script>

<style lang="css" scoped>
</style>
