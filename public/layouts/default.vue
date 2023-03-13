<template>
  <v-app
    :class="appClass"
    :style="localePath('login') === $route.path && $vuetify.theme.light && 'background-color: rgb(245, 245, 245);'"
  >
    <template v-if="isLoginPage">
      <v-app-bar
        app
        fixed
        dense
        flat
        color="transparent"
      >
        <v-spacer />
        <lang-switcher />
      </v-app-bar>
    </template>
    <template v-else>
      <v-app-bar
        v-if="showToolbar"
        app
        dense
        flat
        scroll-off-screen
      >
        <template v-if="localePath('index') !== $route.path">
          <div class="logo-container">
            <a
              v-if="env.homePage"
              :href="env.homePage"
              :title="$t('common.home')"
            >
              <img
                v-if="env.theme.logo"
                :src="env.theme.logo"
              >
              <logo v-else />
            </a>
            <nuxt-link
              v-else
              :to="localePath('index')"
              :title="$t('common.home')"
            >
              <img
                v-if="env.theme.logo"
                :src="env.theme.logo"
              >
              <logo v-else />
            </nuxt-link>
          </div>
          <v-toolbar-title>
            <h1 class="text-h5 hidden-xs-only">
              {{ $t('root.title') }}
            </h1>
          </v-toolbar-title>
        </template>

        <v-spacer />
        <v-toolbar-items>
          <template
            v-if="user && user.adminMode"
            value="true"
          >
            <v-btn
              :to="localePath('admin-users')"
              color="admin"
              dark
              depressed
            >
              {{ $t(`common.users`) }}
            </v-btn>
            <v-btn
              :to="localePath('admin-organizations')"
              color="admin"
              dark
              depressed
            >
              {{ $t(`common.organizations`) }}
            </v-btn>
            <v-btn
              v-if="env.manageSites"
              :to="localePath('admin-sites')"
              color="admin"
              dark
              depressed
            >
              {{ $t(`common.sites`) }}
            </v-btn>
          </template>
          <v-btn
            v-if="env.anonymousContactForm"
            :to="localePath('contact')"
            depressed
          >
            Nous contacter
          </v-btn>
        </v-toolbar-items>
        <personal-menu>
          <template #actions-before="{}">
            <v-list-item
              :to="'/me'"
              :nuxt="true"
            >
              <v-list-item-content>
                <v-list-item-title>{{ $t('common.myAccount') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item
              v-if="user.organization && user.organization.role === 'admin' && (env.depAdminIsOrgAdmin || !user.organization.department)"
              :to="'/organization/' + user.organization.id"
              :nuxt="true"
            >
              <v-list-item-content>
                <v-list-item-title>Gestion de l'organisation</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item
              v-if="user.organization && user.organization.role === 'admin' && user.organization.department"
              :to="'/organization/' + user.organization.id + '/department/' + user.organization.department"
              :nuxt="true"
            >
              <v-list-item-content>
                <v-list-item-title>Gestion du département</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-divider />
          </template>
        </personal-menu>
        <lang-switcher />
      </v-app-bar>
    </template>

    <v-main>
      <v-container fluid>
        <nuxt />
      </v-container>
      <v-snackbar
        v-if="notification"
        ref="notificationSnackbar"
        v-model="showSnackbar"
        :color="notification.type"
        :timeout="notification.type === 'error' ? 30000 : 6000"
        class="notification"
        bottom
      >
        <p>{{ notification.msg }}</p>
        <p
          v-if="notification.errorMsg"
          class="ml-3"
          v-html="notification.errorMsg"
        />

        <template #action="{ }">
          <v-btn
            icon
            @click.native="showSnackbar = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-snackbar>
    </v-main>
    <v-footer
      v-if="!embed && !isLoginPage"
      class="pa-3"
    >
      <v-spacer />
      <div>Powered by <a href="https://koumoul-dev.github.io/simple-directory/">Simple Directory</a></div>
    </v-footer>
  </v-app>
</template>

<script>
import eventBus from '../event-bus'
import logo from '../components/logo.vue'
import PersonalMenu from '@data-fair/sd-vue/src/vuetify/personal-menu.vue'
import LangSwitcher from '@data-fair/sd-vue/src/vuetify/lang-switcher.vue'

const { mapState, mapGetters, mapActions } = require('vuex')

function inIframe () {
  try {
    return window.self !== window.top
  } catch (e) {
    return false
  }
}

export default {
  components: { logo, PersonalMenu, LangSwitcher },
  data () {
    return {
      notification: null,
      showSnackbar: false,
      showNav: this.$route.query && this.$route.query.showNav === 'true'
    }
  },
  head () {
    return {
      htmlAttrs: { lang: this.$i18n.locale }, // TODO: this should be set by @nuxtjs/i18n but it isn't for some reason
      style: [{ vmid: 'dynamic-style', cssText: this.$store.getters.style, type: 'text/css' }],
      __dangerouslyDisableSanitizers: ['style']
    }
  },
  computed: {
    ...mapState('session', ['user', 'initialized']),
    ...mapState(['env', 'userDetails']),
    ...mapGetters('session', ['activeAccount']),
    /* docPages() {
        return this.user && this.user.isAdmin ? ['about', 'install', 'config', 'use'] : []// ['use']
      }, */
    embed () {
      return this.$route.query && this.$route.query.embed === 'true'
    },
    isLoginPage () {
      return this.localePath('login') === this.$route.path
    },
    showToolbar () {
      return !this.embed || (this.$route.query && this.$route.query.showToolbar === 'true')
    },
    appClass () {
      const classes = []
      if (this.$route.name) classes.push('page-' + this.$route.name.replace('___' + this.$i18n.locale, ''))
      if (this.embed) classes.push('embed')
      return classes.join(' ')
    }
  },
  watch: {
    user () {
      console.log('user changed, fetch details', this.user)
      if (!this.userDetails) this.$store.dispatch('fetchUserDetails')
    }
  },
  mounted () {
    this.$store.dispatch('fetchUserDetails')
    eventBus.$on('notification', async notification => {
      this.showSnackbar = false
      await this.$nextTick()
      if (typeof notification === 'string') notification = { msg: notification }
      if (notification.error) {
        notification.type = 'error'
        notification.errorMsg = (notification.error.response && (notification.error.response.data || notification.error.response.status)) || notification.error.message || notification.error
      }
      if (inIframe()) {
        window.top.postMessage({ vIframe: true, uiNotification: notification }, '*')
      } else {
        this.notification = notification
        this.showSnackbar = true
      }
    })
  },
  methods: {
    switchOrganization (orgId) {
      this.$store.dispatch('session/switchOrganization', orgId)
      if (!orgId) this.$router.replace('/me')
      else this.$router.replace(`/organization/${orgId}`)
    },
    ...mapActions('session', ['logout', 'login', 'setAdminMode'])
  }
}

</script>

<style>
body .v-application.embed {
  background: transparent;
}

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
