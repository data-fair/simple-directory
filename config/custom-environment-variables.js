module.exports = {
  port: 'PORT',
  publicUrl: 'PUBLIC_URL',
  kid: 'JWT_KID',
  jwtDurations: {
    initialToken: 'JWT_DURATION_INITIAL',
    echangedToken: 'JWT_DURATION_EXCHANGED',
    invitationToken: 'JWT_DURATION_INVIT'
  },
  admins: {
    __name: 'ADMINS',
    __format: 'json'
  },
  contact: 'CONTACT',
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
    logo: 'BRAND_LOGO',
    dark: {
      __name: 'BRAND_DARK',
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
    cssUrl: 'BRAND_CSS_URL',
    cssText: 'BRAND_CSS_TEXT'
  },
  mails: {
    transport: {
      __name: 'MAILS_TRANSPORT',
      __format: 'json'
    },
    from: 'MAILS_FROM'
  },
  maildev: {
    active: {
      __name: 'MAILDEV_ACTIVE',
      __format: 'json'
    },
    smtp: 'MAILDEV_SMTP',
    web: 'MAILDEV_WEB'
  }
}
