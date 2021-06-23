<template>
  <v-app :class="appClass" :style="localePath('login') === $route.path && 'background-color: rgb(245, 245, 245);'">
    <template v-if="localePath('login') === $route.path">
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
              <img v-if="env.theme.logo" :src="env.theme.logo">
              <logo v-else />
            </a>
            <nuxt-link
              v-else
              :to="localePath('index')"
              :title="$t('common.home')"
            >
              <img v-if="env.theme.logo" :src="env.theme.logo">
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
          <template v-if="user && user.adminMode" value="true">
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
          </template>
          <v-btn
            v-if="env.anonymousContactForm"
            :to="localePath('contact')"
            depressed
          >
            Nous contacter
          </v-btn>
          <template v-if="initialized">
            <v-btn
              v-if="!user"
              depressed
              color="primary"
              @click="login"
            >
              {{ $t('common.logLink') }}
            </v-btn>
            <v-menu
              v-else
              offset-y
              nudge-left
              max-height="510"
            >
              <template #activator="{on}">
                <v-btn
                  text
                  class="px-0"
                  v-on="on"
                >
                  <v-avatar :size="36">
                    <img :src="`${env.publicUrl}/api/avatars/${activeAccount.type}/${activeAccount.id}/avatar.png`">
                  </v-avatar>
                </v-btn>
              </template>

              <v-list outlined>
                <v-list-item disabled>
                  <v-list-item-avatar class="ml-0 my-0">
                    <v-avatar :size="28">
                      <img :src="activeAccount.type === 'user' ? `${env.publicUrl}/api/avatars/user/${user.id}/avatar.png` : `${env.publicUrl}/api/avatars/organization/${activeAccount.id}/avatar.png`">
                    </v-avatar>
                  </v-list-item-avatar>
                  <v-list-item-title>{{ activeAccount.type === 'user' ? 'Compte personnel' : activeAccount.name }}</v-list-item-title>
                </v-list-item>

                <template v-if="user.organizations.length">
                  <v-subheader>Changer de compte</v-subheader>
                  <v-list-item
                    v-if="activeAccount.type !== 'user'"
                    id="toolbar-menu-switch-user"
                    @click="switchOrganization()"
                  >
                    <v-list-item-avatar class="ml-0 my-0">
                      <v-avatar :size="28">
                        <img :src="`${env.publicUrl}/api/avatars/user/${user.id}/avatar.png`">
                      </v-avatar>
                    </v-list-item-avatar>
                    <v-list-item-title>Compte personnel</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-for="organization in user.organizations.filter(o => activeAccount.type === 'user' || activeAccount.id !== o.id)"
                    :id="'toolbar-menu-switch-orga-' + organization.id"
                    :key="organization.id"
                    @click="switchOrganization(organization.id)"
                  >
                    <v-list-item-avatar class="ml-0 my-0">
                      <v-avatar :size="28">
                        <img :src="`${env.publicUrl}/api/avatars/organization/${organization.id}/avatar.png`">
                      </v-avatar>
                    </v-list-item-avatar>
                    <v-list-item-title>{{ organization.name }}</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                </template>
                <v-list-item :to="'/me'" :nuxt="true">
                  <v-list-item-content>
                    <v-list-item-title>Mon compte</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item
                  v-if="user.organization"
                  :to="'/organization/' + user.organization.id"
                  :nuxt="true"
                >
                  <v-list-item-content>
                    <v-list-item-title>Gestion de l'organisation</v-list-item-title>
                  </v-list-item-content>
                </v-list-item>

                <!-- toggle admin mode -->
                <template v-if="user.isAdmin">
                  <v-divider />
                  <v-list-item dense>
                    <v-list-item-action><v-icon>mdi-shield-alert</v-icon></v-list-item-action>
                    <v-list-item-title style="overflow: visible;">
                      <v-switch
                        v-model="user.adminMode"
                        color="admin"
                        hide-details
                        class="mt-0"
                        label="mode admin"
                        @change="setAdminMode"
                      />
                    </v-list-item-title>
                  </v-list-item>
                </template>

                <!-- leave admin impersonification of a user -->
                <template v-if="user.asAdmin">
                  <v-divider />
                  <v-list-item dense @click="asAdmin()">
                    <v-list-item-title style="overflow: visible;">
                      {{ $t('common.delAsAdmin') }}
                    </v-list-item-title>
                  </v-list-item>
                </template>

                <v-divider />

                <v-list-item v-if="env.darkModeSwitch" dense>
                  <v-list-item-action><v-icon>mdi-weather-night</v-icon></v-list-item-action>
                  <v-list-item-title style="overflow: visible;">
                    <v-switch
                      v-model="$vuetify.theme.dark"
                      hide-details
                      class="mt-0"
                      label="mode nuit"
                      color="white"
                      @change="setDarkCookie"
                    />
                  </v-list-item-title>
                </v-list-item>

                <v-list-item @click="logout();reload()">
                  <v-list-item-action><v-icon>mdi-logout</v-icon></v-list-item-action>
                  <v-list-item-title>Se déconnecter</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
        </v-toolbar-items>
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
        <div>
          <p>{{ notification.msg }}</p>
          <p v-if="notification.errorMsg" class="ml-3">
            {{ notification.errorMsg }}
          </p>
        </div>
        <v-btn
          text
          icon
          @click.native="showSnackbar = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-snackbar>
    </v-main>
    <v-footer v-if="!embed" class="pa-3">
      <v-spacer />
      <div>Powered by <a href="https://koumoul-dev.github.io/simple-directory/">Simple Directory</a></div>
    </v-footer>
  </v-app>
</template>

<script>
  import eventBus from '../event-bus'
  import logo from '../components/logo.vue'
  import langSwitcher from '../components/lang-switcher.vue'
  const { mapState, mapGetters, mapActions } = require('vuex')

  export default {
    components: { logo, langSwitcher },
    data() {
      return {
        notification: null,
        showSnackbar: false,
        showNav: this.$route.query && this.$route.query.showNav === 'true',
      }
    },
    computed: {
      ...mapState('session', ['user', 'initialized']),
      ...mapState(['env', 'userDetails']),
      ...mapGetters('session', ['activeAccount']),
      /* docPages() {
        return this.user && this.user.isAdmin ? ['about', 'install', 'config', 'use'] : []// ['use']
      }, */
      embed() {
        return this.$route.query && this.$route.query.embed === 'true'
      },
      showToolbar() {
        return !this.embed || (this.$route.query && this.$route.query.showToolbar === 'true')
      },
      appClass() {
        const classes = []
        if (this.$route.name) classes.push('page-' + this.$route.name.replace('___' + this.$i18n.locale, ''))
        if (this.embed) classes.push('embed')
        return classes.join(' ')
      },
    },
    watch: {
      user() {
        if (!this.userDetails) this.$store.dispatch('fetchUserDetails')
      },
    },
    mounted() {
      this.$store.dispatch('fetchUserDetails')
      eventBus.$on('notification', async notif => {
        this.showSnackbar = false
        await this.$nextTick()
        if (typeof notif === 'string') notif = { msg: notif }
        if (notif.error) {
          notif.type = 'error'
          notif.errorMsg = (notif.error.response && (notif.error.response.data || notif.error.response.status)) || notif.error.message || notif.error
        }
        this.notification = notif
        this.showSnackbar = true
      })
    },
    methods: {
      reload() {
        window.location.reload()
      },
      switchOrganization(orgId) {
        this.$store.dispatch('session/switchOrganization', orgId)
        if (!orgId) this.$router.replace('/me')
        else this.$router.replace(`/organization/${orgId}`)
      },
      ...mapActions('session', ['logout', 'login', 'setAdminMode', 'asAdmin']),
    },
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

body .v-application .notification .v-snack__content {
  height: auto;
}
body .v-application .notification .v-snack__content p {
  margin-bottom: 4px;
  margin-top: 4px;
}

/* No need to prevent users from selecting (and copying) the texts in lists */
body .v-application .v-list__tile {
  user-select: text;
}

</style>
