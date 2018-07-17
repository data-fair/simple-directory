module.exports = {
  port: 'PORT',
  publicUrl: 'PUBLIC_URL',
  kid: 'JWT_KID',
  jwtDurations: {
    initialToken: 'JWT_DURATION_INITIAL',
    exchangedToken: 'JWT_DURATION_EXCHANGED',
    invitationToken: 'JWT_DURATION_INVIT'
  },
  admins: {
    __name: 'ADMINS',
    __format: 'json'
  },
  roles: {
    defaults: {
      __name: 'ROLES_DEFAULTS',
      __format: 'json'
    },
    editable: 'ROLES_EDITABLE'
  },
  contact: 'CONTACT',
  homePage: 'HOME_PAGE',
  secret: {
    public: 'PUBLIC_KEY',
    private: 'PRIVATE_KEY'
  },
  storage: {
    type: 'STORAGE_TYPE',
    file: {
      users: 'STORAGE_FILE_USERS',
      organizations: 'STORAGE_FILE_ORGS'
    },
    mongo: {
      url: 'STORAGE_MONGO_URL'
    }
  },
  webhooks: {
    updateEntityNames: {
      __name: 'NAMES_WEBHOOKS',
      __format: 'json'
    }
  },
  theme: {
    logo: 'THEME_LOGO',
    dark: {
      __name: 'THEME_DARK',
      __format: 'json'
    },
    colors: {
      primary: 'THEME_PRIMARY',
      secondary: 'THEME_SECONDARY',
      accent: 'THEME_ACCENT',
      error: 'THEME_ERROR',
      info: 'THEME_INFO',
      success: 'THEME_SUCCESS',
      warning: 'THEME_WARNING'
    },
    cssUrl: 'THEME_CSS_URL',
    cssText: 'THEME_CSS_TEXT'
  },
  mails: {
    transport: {
      __name: 'MAILS_TRANSPORT',
      __format: 'json'
    },
    from: 'MAILS_FROM'
  },
  maildev: {
    url: 'MAILDEV_URL',
    active: {
      __name: 'MAILDEV_ACTIVE',
      __format: 'json'
    },
    smtp: 'MAILDEV_SMTP',
    web: 'MAILDEV_WEB'
  },
  nuxtBuild: {
    active: {
      __name: 'NUXT_BUILD_ACTIVE',
      __format: 'json'
    },
    blocking: {
      __name: 'NUXT_BUILD_BLOCKING',
      __format: 'json'
    }
  },
  i18n: {
    defaultLocale: 'I18N_DEFAULT_LOCALE',
    locales: {
      __name: 'I18N_LOCALES',
      __format: 'json'
    }
  },
  quotas: {
    defaultMaxCreatedOrgs: {
      __name: 'DEFAULT_MAX_CREATED_ORGS',
      __format: 'json'
    }
  },
  listEntitiesMode: 'LIST_ENTITIES_MODE'
}
