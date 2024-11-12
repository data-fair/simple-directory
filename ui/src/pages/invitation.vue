<!-- eslint-disable vue/no-v-html -->
<template>
  <v-container
    class="fill-height"
    data-iframe-height
  >
    <v-row align="center">
      <v-col class="text-center">
        <h3 class="text-h2">
          {{ $t('pages.invitation.title') }}
        </h3>

        <v-divider class="my-3" />

        <span
          v-if="sameUser"
          class="subheading"
          v-html="$t('pages.invitation.msgSameUser', {profileUrl: $sdUrl + '/me'})"
        />
        <span
          v-else
          class="subheading"
          v-html="$t('pages.invitation.msgDifferentUser', {loginUrl: $sdUrl + '/login?email=' + encodeURIComponent($route.query.email)})"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const route = useRoute()
const { user, keepalive } = useSession()
const sameUser = user.value && user.value.email === route.query.email
if (sameUser) await keepalive
</script>
