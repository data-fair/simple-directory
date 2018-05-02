<template>
  <v-app>
    <template v-if="localePath('login') === $route.path">
      <v-toolbar app fixed flat color="transparent">
        <v-spacer/>
        <lang-switcher />
      </v-toolbar>
    </template>
    <template v-else>
      <v-navigation-drawer v-model="drawer" fixed app>
        <v-subheader>Documentation</v-subheader>
        <v-list>
          <v-list-tile v-for="page in docPages" :key="page" :to="localePath({name: 'doc-id', params: {id: page}})">
            <v-list-tile-title>{{ $t(`doc.${page}.link`) }}</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-navigation-drawer>

      <v-toolbar app scroll-off-screen color="white">
        <v-toolbar-side-icon @click.stop="drawer = !drawer"/>
        <template v-if="localePath('index') !== $route.path">
          <div class="logo-container">
            <nuxt-link :to="localePath('index')" :title="$t('common.home')">
              <img v-if="env.brand.logo" :src="env.brand.logo">
              <logo v-else/>
            </nuxt-link>
          </div>
          <v-toolbar-title><h1 class="headline">{{ $t('common.title') }}</h1></v-toolbar-title>
        </template>

        <v-spacer/>

        <lang-switcher />

      </v-toolbar>
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
        <v-btn flat icon @click.native="showSnackbar = false"><v-icon>close</v-icon></v-btn>
      </v-snackbar>
    </v-content>
    <v-footer class="pa-3">
      <v-spacer/>
      <div>Powered by <a href="https://koumoul-dev.github.io/simple-directory/">Simple Directory</a></div>
    </v-footer>
  </v-app>
</template>

<script>
import eventBus from '../event-bus'
import logo from '../components/logo.vue'
import langSwitcher from '../components/lang-switcher.vue'
const {mapState, mapActions} = require('vuex')

export default {
  components: {logo, langSwitcher},
  data() {
    return {
      notification: null,
      showSnackbar: false,
      drawer: false,
      docPages: ['about', 'install', 'config', 'use']
    }
  },
  computed: {
    ...mapState(['user', 'env'])
  },
  mounted() {
    eventBus.$on('notification', notif => {
      if (typeof notif === 'string') notif = {msg: notif}
      if (notif.error) {
        notif.type = 'error'
        notif.errorMsg = (notif.error.response && (notif.error.response.data || notif.error.response.status)) || notif.error.message || notif.error
      }
      this.notification = notif
      this.showSnackbar = true
    })
  },
  methods: mapActions(['logout'])
}

</script>

<style lang="less">
body .application {
  font-family: 'Nunito', sans-serif;

  .logo-container {
    height: 100%;
    padding: 4px;
    margin-left: 4px !important;
    margin-right: 4px;

    img, svg {
      height:100%;
    }
  }

  .notification .snack__content {
    height: auto;
    p {
      margin-bottom: 4px;
      margin-top: 4px;
    }
  }
}

</style>
