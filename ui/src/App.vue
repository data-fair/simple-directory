<template>
  <v-app
    :class="appClass"
  >
    <template v-if="!isLoginPage">
      <layout-app-bar v-if="!inIframe" />
    </template>

    <v-main>
      <v-container fluid>
        <RouterView />
      </v-container>
      <ui-notif />
    </v-main>
    <!--<v-footer
      v-if="!embed && !isLoginPage"
      class="pa-3"
    >
      <v-spacer />
      <div>Powered by <a href="https://data-fair.github.io/simple-directory/">Simple Directory</a></div>
    </v-footer>-->
  </v-app>
</template>

<script lang="ts" setup>
import uiNotif from '@data-fair/lib-vuetify/ui-notif.vue'
import inIframe from '@data-fair/lib-utils/in-iframe.js'

const session = useSession()
const route = useRoute()

useHead({
  htmlAttrs: () => ({ lang: session.lang.value ?? 'fr' }),
  // style: () => globalStyle
  // __dangerouslyDisableSanitizers: ['style']
})

// const embed = useBooleanSearchParam('embed')
// const showToolbarParam = useBooleanSearchParam('showToolbar')

const isLoginPage = computed(() => route.name === '/login')

// const showToolbar = computed(() => !embed.value || showToolbarParam.value)
const appClass = computed(() => {
  if (!route.name) return ''
  return 'page' + route.name.replace(/\//g, '')
})

/* export default {
  head () {
    return {
      htmlAttrs: { lang: this.$i18n.locale },
      style: [{ vmid: 'dynamic-style', cssText: this.$store.getters.style, type: 'text/css' }],
      __dangerouslyDisableSanitizers: ['style']
    }
  },
  computed: {
    ...mapState('session', ['user', 'initialized']),
    ...mapState(['env', 'userDetails']),
    ...mapGetters('session', ['activeAccount']),
    embed () {
      return route.query && route.query.embed === 'true'
    },
    isLoginPage () {
      return this.localePath('login') === route.path
    },
    showToolbar () {
      return !this.embed || (route.query && route.query.showToolbar === 'true')
    },
    appClass () {
      const classes = []
      if (route.name) classes.push('page-' + route.name.replace('___' + this.$i18n.locale, ''))
      return classes.join(' ')
    }
  },
  mounted () {
    this.$store.dispatch('fetchUserDetails')
  },
  methods: {
    switchOrganization (orgId) {
      this.$store.dispatch('session/switchOrganization', orgId)
      if (!orgId) router.replace('/me')
      else router.replace(`/organization/${orgId}`)
    },
    ...mapActions('session', ['logout', 'login', 'setAdminMode'])
  }
} */

</script>

<style>
body .v-application .logo-container {
  height: 100%;
  padding: 4px;
  margin-left: 4px !important;
  margin-right: 4px;
  width: 64px;
}
body .v-application .logo-container img, body .v-application .logo-container svg {
  height:100%;
}

.notification.v-snack .v-snack__wrapper {
  min-width: 256px;
}
.notification.v-snack .v-snack__content {
  height: auto;
}
.notification.v-snack .v-snack__content p {
  margin-bottom: 4px;
  margin-top: 4px;
}

/* No need to prevent users from selecting (and copying) the texts in lists */
body .v-application .v-list__tile {
  user-select: text;
}

</style>
