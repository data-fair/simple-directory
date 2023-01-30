<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      fixed
      app
      width="300"
    >
      <v-list-item
        :to="localePath({name: `index`})"
        nuxt
        exact
      >
        <v-list-item-avatar class="brand-logo">
          <img src="~/assets/logo.svg">
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title class="text-h5 font-weight-bold">
            Simple Directory
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list>
        <v-list-item
          v-for="page in pages"
          :key="page"
          :to="localePath({name: 'doc-id', params: {id: page}})"
        >
          <v-list-item-title>{{ $t(`doc.${page}.link`) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <v-btn
        absolute
        top
        left
        icon
        @click.stop="drawer = !drawer"
      >
        <v-icon>mdi-menu</v-icon>
      </v-btn>
      <v-speed-dial
        direction="bottom"
        transition="fade-transition"
        absolute
        top
        right
      >
        <template #activator>
          <v-btn
            icon
            color="primary"
            style="font-weight:bold;"
          >
            {{ $i18n.locale }}
          </v-btn>
        </template>
        <v-btn
          v-for="locale in $i18n.locales.filter(l => l !== $i18n.locale)"
          :key="locale"
          :to="switchLocalePath(locale)"
          icon
          style="font-weight:bold;"
          nuxt
        >
          {{ locale }}
        </v-btn>
      </v-speed-dial>
      <nuxt />
    </v-main>

    <v-footer class="pa-3">
      <v-spacer />
      <div>Maintained by <a href="https://koumoul.com">Koumoul</a></div>
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
body .v-application {
  font-family: 'Nunito', sans-serif;

  a {
    text-decoration: none;
  }
}

.brand-logo.v-avatar {
  border-radius: 0;
  overflow: visible;
}
.brand-logo.v-avatar img {
  width: 40px !important;
  height: auto !important;
}

</style>
