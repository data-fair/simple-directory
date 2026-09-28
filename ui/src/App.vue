<template>
  <v-app
    :class="appClass"
  >
    <template v-if="!isLoginPage">
      <layout-app-bar v-if="!inIframe" />
    </template>

    <v-main
      :scrollable="scrollable"
      :class="{ 'main-with-navigation-right': scrollable }"
    >
      <!-- min-width: 0 lets the content shrink next to the right panel instead of overflowing -->
      <div
        class="flex-grow-1"
        style="min-width: 0"
      >
        <v-container fluid>
          <RouterView />
        </v-container>
      </div>
      <!-- target of layout-navigation-right.vue, sticky inside the scroller so that the
      scrollbar stays on the right of the page, same width as a vuetify navigation drawer -->
      <div
        v-if="scrollable"
        id="navigation-right-local"
        class="position-sticky top-0 flex-shrink-0 align-self-start overflow-y-auto pt-6"
        style="width: 256px; max-height: 100vh"
      />
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
  // unhead 3 resolves reactivity per attribute rather than over the whole object
  htmlAttrs: { lang: () => session.lang.value ?? 'fr' },
  // style: () => globalStyle
  // __dangerouslyDisableSanitizers: ['style']
})

// const embed = useBooleanSearchParam('embed')
// const showToolbarParam = useBooleanSearchParam('showToolbar')

const isLoginPage = computed(() => route.name === '/login')

// pages with a table of contents (@data-fair/lib-vuetify/toc.vue) track the scroll of .v-main__scroller
// and put it in the right panel (layout-navigation-right.vue), the other pages keep the document scroll
// that the auto-height of their embedding iframes relies on
const scrollable = computed(() => route.name === '/organization/[id]/')

// const showToolbar = computed(() => !embed.value || showToolbarParam.value)
const appClass = computed(() => {
  if (!route.name || typeof route.name !== 'string') return ''
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
@layer vuetify-core.reset {
  h1, h2, h3, h4, h5, h6 {
    padding: 0;
    margin: 0;
  }
}

/* neutralize the browser autofill colors, which are applied with !important
   cf https://stackoverflow.com/a/37432260 */
.v-field input:-webkit-autofill {
  transition: background-color 5000s ease-in-out 0s;
  -webkit-text-fill-color: rgb(var(--v-theme-on-surface)) !important;
}

/* chrome autofills a password on load without exposing the value to the page until the
   user interacts, so the field never becomes active: float its label like VField.css does */
.v-field:has(input:-webkit-autofill) .v-label.v-field-label {
  visibility: hidden;
}
.v-field:has(input:-webkit-autofill) .v-label.v-field-label--floating {
  visibility: unset;
}
.v-field--variant-outlined:has(input:-webkit-autofill) .v-field__outline__notch::before {
  opacity: 0;
}

body .v-application .logo-container {
  height: 100%;
  padding: 4px;
  margin-left: 4px;
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

/* the content and the right panel side by side inside the scroller */
.main-with-navigation-right .v-main__scroller {
  display: flex !important;
}
#navigation-right-local:empty {
  display: none;
}

/* No need to prevent users from selecting (and copying) the texts in lists */
body .v-application .v-list__tile {
  user-select: text;
}

</style>
