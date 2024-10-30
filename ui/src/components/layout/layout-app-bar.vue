<template>
  <v-app-bar
    dense
    flat
    scroll-behavior="hide"
  >
    <template v-if="$route.name !== '/'">
      <div class="logo-container">
        <a
          v-if="$uiConfig.homePage"
          :href="$uiConfig.homePage"
          :title="$t('common.home')"
        >
          <img
            v-if="$uiConfig.theme.logo"
            :src="$uiConfig.theme.logo"
          >
          <logo v-else />
        </a>
        <router-link
          v-else
          :to="'index'"
          :title="$t('common.home')"
        >
          <img
            v-if="$uiConfig.theme.logo"
            :src="$uiConfig.theme.logo"
          >
          <logo v-else />
        </router-link>
      </div>
      <v-toolbar-title>
        <h1 class="text-h5 hidden-xs">
          {{ $t('root.title') }}
        </h1>
      </v-toolbar-title>
    </template>

    <v-spacer />
    <v-toolbar-items>
      <template
        v-if="user && user.adminMode"
      >
        <v-btn
          :to="'admin-users'"
          color="admin"
          theme="dark"
          variant="flat"
        >
          {{ $t(`common.users`) }}
        </v-btn>
        <v-btn
          :to="'admin-organizations'"
          color="admin"
          theme="dark"
          variant="flat"
        >
          {{ $t(`common.organizations`) }}
        </v-btn>
        <v-btn
          v-if="$uiConfig.manageSites"
          :to="'admin-sites'"
          color="admin"
          theme="dark"
          variant="flat"
        >
          {{ $t(`common.sites`) }}
        </v-btn>
        <v-btn
          :to="'admin-oauth-tokens'"
          color="admin"
          theme="dark"
          variant="flat"
        >
          {{ $t(`common.oauthTokens`) }}
        </v-btn>
      </template>
      <v-btn
        v-if="$uiConfig.anonymousContactForm"
        :to="'contact'"
        variant="flat"
      >
        Nous contacter
      </v-btn>
    </v-toolbar-items>
    <personal-menu>
      <template #actions-before="{}">
        <v-list-item
          :to="'/me'"
        >
          <v-list-item-title>{{ $t('common.myAccount') }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="organization && organization.role === 'admin' && ($uiConfig.depAdminIsOrgAdmin || !organization.department)"
          :to="'/organization/' + organization.id"
        >
          <v-list-item-title>Gestion de l'organisation</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="organization && organization.role === 'admin' && organization.department"
          :to="'/organization/' + organization.id + '/department/' + organization.department"
        >
          <v-list-item-title>Gestion du département</v-list-item-title>
        </v-list-item>
        <v-divider />
      </template>
    </personal-menu>
    <lang-switcher :locales="$uiConfig.i18n.locales" />
  </v-app-bar>
</template>

<script lang="ts" setup>
const { user, organization } = useSession()
import PersonalMenu from '@data-fair/lib-vuetify/personal-menu.vue'
import LangSwitcher from '@data-fair/lib-vuetify/lang-switcher.vue'
</script>
