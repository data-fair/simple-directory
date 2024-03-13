<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      fixed
      app
    >
      <v-subheader>Documentation</v-subheader>
      <v-list>
        <v-list-tile
          v-for="page in pages"
          :key="page"
          :to="localePath({name: 'doc-id', params: {id: page}})"
        >
          <v-list-tile-title>{{ $t(`doc.${page}.link`) }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar
      app
      scroll-off-screen
      color="white"
    >
      <v-toolbar-side-icon @click.stop="drawer = !drawer" />
      <template v-if="$route.path !== localePath('index')">
        <div class="logo-container">
          <nuxt-link
            :title="$t('home')"
            :to="localePath('index')"
          >
            <img
              src="../../public/assets/logo.svg"
              style="max-width: 150px;"
            >
          </nuxt-link>
        </div>
        <v-toolbar-title>
          <h1 class="text-h5">
            Simple Directory
          </h1>
        </v-toolbar-title>
      </template>

      <v-spacer />

      <v-speed-dial
        direction="bottom"
        transition="fade-transition"
      >
        <v-btn
          slot="activator"
          fab
          flat
          small
        >
          {{ $i18n.locale }}
        </v-btn>
        <v-btn
          v-for="locale in $i18n.locales.filter(l => l.code !== $i18n.locale)"
          :key="locale.code"
          :to="switchLocalePath(locale.code)"
          fab
          small
          nuxt
        >
          {{ locale.code }}
        </v-btn>
      </v-speed-dial>
    </v-toolbar>
    <v-content>
      <v-container fluid>
        <nuxt />
      </v-container>
    </v-content>
    <v-footer class="pa-3">
      <v-spacer />
      <div>Powered by <a href="https://data-fair.github.io/simple-directory/">Simple Directory</a></div>
    </v-footer>
  </v-app>
</template>

<script>

export default {
  data: () => ({
    drawer: true,
    pages: ['about', 'install', 'config', 'use']
  })
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
