<template>
  <v-app>
    <v-toolbar app scroll-off-screen color="transparent" flat>
      <template v-if="![localePath('index'), localePath('login')].includes($route.path)">
        <div class="logo-container">
          <nuxt-link :to="localePath('index')" :title="$t('home')">
            <img v-if="env.brand.logo" :src="env.brand.logo">
            <logo v-else/>
          </nuxt-link>
        </div>
        <v-toolbar-title><h1 class="headline">{{ env.brand.title }}</h1></v-toolbar-title>
      </template>

      <v-spacer/>

      <v-speed-dial
        direction="bottom"
        transition="fade-transition"
      >
        <v-btn slot="activator" fab flat small>{{ $i18n.locale }}</v-btn>
        <v-btn v-for="locale in $i18n.locales.filter(l => l.code !== $i18n.locale)" :key="locale.code" :to="switchLocalePath(locale.code)" fab small nuxt>
          {{ locale.code }}
        </v-btn>
      </v-speed-dial>

    </v-toolbar>
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
const {mapState, mapActions} = require('vuex')

export default {
  components: {logo},
  data() {
    return {
      notification: null,
      showSnackbar: false
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

  main.content {
    // background-color: white;
  }

  .main-toolbar {

  }

  .actions-buttons {
    position: absolute;
    top: 76px;
    right: 8px;
    margin: 0;

    .v-btn {
      margin-bottom: 16px;
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
