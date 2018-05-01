<template>
  <v-app>
    <v-toolbar app scroll-off-screen color="transparent" flat>
      <template v-if="$route.path !== localePath('index')">
        <div class="logo-container">
          <nuxt-link :title="$t('home')" :to="localePath('index')">
            <img src="../../public/assets/logo.svg" style="max-width: 150px;">
          </nuxt-link>
        </div>
        <v-toolbar-title><h1 class="headline">Simple Directory</h1></v-toolbar-title>
      </template>

      <v-spacer/>

      <v-btn :to="localePath({name: 'doc-id', params: {id: 'about'}})" flat small color="primary">
        {{ $t('doc.about.link') }}
      </v-btn>

      <v-btn :to="localePath({name: 'doc-id', params: {id: 'install'}})" flat small color="primary">
        {{ $t('doc.install.link') }}
      </v-btn>

      <v-btn :to="localePath({name: 'doc-id', params: {id: 'config'}})" flat small color="primary">
        {{ $t('doc.config.link') }}
      </v-btn>

      <v-btn :to="localePath({name: 'doc-id', params: {id: 'use'}})" flat small color="primary">
        {{ $t('doc.use.link') }}
      </v-btn>

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
    </v-content>
    <v-footer class="pa-3">
      <v-spacer/>
      <div>Powered by <a href="https://koumoul-dev.github.io/simple-directory/">Simple Directory</a></div>
    </v-footer>
  </v-app>
</template>

<script>

export default {}

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
