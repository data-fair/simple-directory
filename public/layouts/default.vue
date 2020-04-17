<template>
  <v-app :dark="env.theme.dark" :class="appClass" data-iframe-height>
    <template v-if="localePath('login') === $route.path">
      <v-toolbar app fixed flat color="transparent">
        <v-spacer/>
        <lang-switcher />
      </v-toolbar>
    </template>
    <template v-else>
      <v-navigation-drawer v-model="drawer" fixed app>
        <v-list>

          <!-- User-s profile page -->
          <v-list-tile v-if="user" :to="localePath('me')">
            <v-list-tile-action>
              <v-icon>mdi-account-circle</v-icon>
            </v-list-tile-action>
            <v-list-tile-title>{{ $t('common.myAccount') }}</v-list-tile-title>
          </v-list-tile>

          <!-- User's organizations pages (only admin) -->
          <v-list-tile v-for="orga in userDetails && userDetails.organizations" v-if="orga.role === 'admin'" :key="orga.id" :to="localePath({name: 'organization-id', params: {id: orga.id}})">
            <v-list-tile-action>
              <v-icon>mdi-account-multiple</v-icon>
            </v-list-tile-action>
            <v-list-tile-title>{{ $t('common.organization') + ' ' + orga.name }}</v-list-tile-title>
          </v-list-tile>

          <!-- Create organization -->
          <v-list-tile v-if="!env.readonly && userDetails && (userDetails.maxCreatedOrgs || env.defaultMaxCreatedOrgs !== 0)" :to="localePath('create-organization')" color="accent">
            <v-list-tile-action>
              <v-icon>mdi-plus</v-icon>
            </v-list-tile-action>
            <v-list-tile-title>
              {{ $t('common.createOrganization') }}
            </v-list-tile-title>

          </v-list-tile>

          <v-divider/>

          <!-- Administration pages -->
          <v-list-group v-if="user && user.adminMode" value="true">
            <v-list-tile slot="activator" color="admin">
              <v-list-tile-action>
                <v-icon color="admin">mdi-shield-check</v-icon>
              </v-list-tile-action>
              <v-list-tile-title>{{ $t('common.administration') }}</v-list-tile-title>
            </v-list-tile>
            <v-list-tile :to="localePath('admin-users')" color="admin">
              <v-list-tile-title>{{ $t(`common.users`) }}</v-list-tile-title>
            </v-list-tile>
            <v-list-tile :to="localePath('admin-organizations')" color="admin">
              <v-list-tile-title>{{ $t(`common.organizations`) }}</v-list-tile-title>
            </v-list-tile>
          </v-list-group>

          <!-- Documentation pages -->
          <v-list-group v-if="!embed && docPages.length" value="true">
            <v-list-tile slot="activator">
              <v-list-tile-action>
                <v-icon>mdi-help-circle</v-icon>
              </v-list-tile-action>
              <v-list-tile-title>{{ $t('common.documentation') }}</v-list-tile-title>
            </v-list-tile>
            <v-list-tile v-for="page in docPages" :key="page" :to="localePath({name: 'doc-id', params: {id: page}})">
              <v-list-tile-title>{{ $t(`doc.${page}.link`) }}</v-list-tile-title>
            </v-list-tile>
          </v-list-group>
        </v-list>
      </v-navigation-drawer>

      <v-toolbar v-if="showToolbar" :color="(user && user.adminMode) ? 'admin' : 'default'" :dark="user && user.adminMode" app scroll-off-screen>
        <v-toolbar-side-icon v-if="user" @click.stop="drawer = !drawer"/>
        <template v-if="localePath('index') !== $route.path">
          <div class="logo-container">
            <a v-if="env.homePage" :href="env.homePage" :title="$t('common.home')">
              <img v-if="env.theme.logo" :src="env.theme.logo">
              <logo v-else/>
            </a>
            <nuxt-link v-else :to="localePath('index')" :title="$t('common.home')">
              <img v-if="env.theme.logo" :src="env.theme.logo">
              <logo v-else/>
            </nuxt-link>
          </div>
          <v-toolbar-title><h1 class="headline hidden-xs-only">{{ $t('root.title') }}</h1></v-toolbar-title>
        </template>

        <v-spacer/>

        <v-btn v-if="!user" color="primary" @click="login">
          {{ $t('common.logLink') }}
        </v-btn>
        <v-menu v-else-if="userDetails" offset-y>
          <v-btn slot="activator" flat>{{ user.name }}</v-btn>
          <v-list>
            <v-list-tile @click="logout">
              <v-list-tile-title>{{ $t('common.logout') }}</v-list-tile-title>
            </v-list-tile>
            <v-list-tile v-if="user.asAdmin" @click="asAdmin()">
              <v-list-tile-title>{{ $t('common.delAsAdmin') }}</v-list-tile-title>
            </v-list-tile>
            <v-list-tile v-if="user.isAdmin && !user.adminMode" color="admin" @click="setAdminMode(true)">
              <v-list-tile-title>{{ $t('common.activateAdminMode') }}</v-list-tile-title>
            </v-list-tile>
            <v-list-tile v-if="user.isAdmin && user.adminMode" color="admin" @click="setAdminMode(false)">
              <v-list-tile-title>{{ $t('common.deactivateAdminMode') }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>

        <lang-switcher />
      </v-toolbar>
      <v-toolbar-side-icon v-else-if="showNav" @click.stop="drawer = !drawer"/>
    </template>

    <v-content>
      <v-container fluid>
        <nuxt/>
      </v-container>
      <v-snackbar v-if="notification" ref="notificationSnackbar" v-model="showSnackbar" :color="notification.type" :timeout="notification.type === 'error' ? 30000 : 6000" class="notification" bottom>
        <div>
          <p>{{ notification.msg }}</p>
          <p v-if="notification.errorMsg" class="ml-3">{{ notification.errorMsg }}</p>
        </div>
        <v-btn flat icon @click.native="showSnackbar = false"><v-icon>mdi-close</v-icon></v-btn>
      </v-snackbar>
    </v-content>
    <v-footer v-if="!embed" class="pa-3">
      <v-spacer/>
      <div>Powered by <a href="https://koumoul-dev.github.io/simple-directory/">Simple Directory</a></div>
    </v-footer>
  </v-app>
</template>

<script>
import eventBus from '../event-bus'
import logo from '../components/logo.vue'
import langSwitcher from '../components/lang-switcher.vue'
const { mapState, mapActions } = require('vuex')

export default {
  components: { logo, langSwitcher },
  data() {
    return {
      notification: null,
      showSnackbar: false,
      showNav: this.$route.query && this.$route.query.showNav === 'true',
      drawer: this.$route.query && this.$route.query.showNav === 'true'
    }
  },
  computed: {
    ...mapState('session', ['user']),
    ...mapState(['env', 'userDetails']),
    docPages() {
      return this.user && this.user.isAdmin ? ['about', 'install', 'config', 'use'] : []// ['use']
    },
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
    }
  },
  watch: {
    user() {
      if (!this.userDetails) this.$store.dispatch('fetchUserDetails')
    }
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
  methods: mapActions('session', ['logout', 'login', 'setAdminMode', 'asAdmin'])
}

</script>

<style lang="less">
body .application.embed {
  background: transparent;
}

body .application {

  .logo-container {
    height: 100%;
    padding: 4px;
    margin-left: 4px !important;
    margin-right: 4px;
    width: 64px;
    img, svg {
      height:100%;
    }
  }

  .notification .v-snack__content {
    height: auto;
    p {
      margin-bottom: 4px;
      margin-top: 4px;
    }
  }

  // No need to prevent users from selecting (and copying) the texts in lists
  .v-list__tile {
    user-select: text;
  }
}

</style>
