<template>
  <v-app-bar
    density="comfortable"
    class="border-b-sm"
    scroll-behavior="elevate"
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
          to="/"
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
        v-if="user?.adminMode"
      >
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              color="admin"
              variant="flat"
            >
              {{ $t(`common.adminGlobal`) }}
            </v-btn>
          </template>
          <v-list color="admin">
            <v-list-item
              to="/admin/users"
            >
              {{ $t(`common.users`) }}
            </v-list-item>
            <v-list-item
              to="/admin/organizations"
            >
              {{ $t(`common.organizations`) }}
            </v-list-item>
            <v-list-item
              v-if="$uiConfig.manageSites"
              to="/admin/sites"
            >
              {{ $t(`common.sites`) }}
            </v-list-item>
            <v-list-item
              to="/admin/oauth-tokens"
            >
              {{ $t(`common.oauthTokens`) }}
            </v-list-item>
            <v-list-item
              to="/admin/password-lists"
            >
              {{ $t(`common.passwordLists`) }}
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      <template
        v-if="!isMainSite && (user?.adminMode || ($uiConfig.siteAdmin && siteRole === 'admin'))"
      >
        <v-menu>
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              color="admin"
              variant="outlined"
              class="ml-2"
            >
              {{ $t(`common.adminSite`) }}
            </v-btn>
          </template>
          <v-list color="admin">
            <v-list-item
              to="/site-admin/users"
            >
              {{ $t(`common.users`) }}
            </v-list-item>
            <v-list-item
              v-if="$uiConfig.siteOrgs"
              to="/site-admin/organizations"
            >
              {{ $t(`common.organizations`) }}
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      <v-btn
        v-if="$uiConfig.anonymousContactForm"
        to="/contact"
        variant="flat"
      >
        Nous contacter
      </v-btn>
    </v-toolbar-items>
    <personal-menu>
      <template #actions-before="{}">
        <v-list-item
          to="/me"
        >
          <v-list-item-title>{{ $t('common.myAccount') }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="organization && organization.role === 'admin' && ($uiConfig.depAdminIsOrgAdmin || !organization.department)"
          :to="'/organization/' + organization.id"
        >
          <v-list-item-title>{{ $t('common.manageOrg') }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="organization && organization.role === 'admin' && organization.department"
          :to="'/organization/' + organization.id + '/department/' + organization.department"
        >
          <v-list-item-title>{{ $t('common.manageDep') }}</v-list-item-title>
        </v-list-item>
        <v-divider />
      </template>
    </personal-menu>
    <theme-switcher />
    <lang-switcher :locales="$uiConfig.i18n.locales" />
  </v-app-bar>
</template>

<script lang="ts" setup>
import PersonalMenu from '@data-fair/lib-vuetify/personal-menu.vue'
import LangSwitcher from '@data-fair/lib-vuetify/lang-switcher.vue'
import ThemeSwitcher from '@data-fair/lib-vuetify/theme-switcher.vue'

const { user, organization, siteRole } = useSession()
const { isMainSite } = useStore()
</script>
