module.exports = {
  port: 'PORT',
  publicUrl: 'PUBLIC_URL',
  kid: 'JWT_KID',
  oldSessionDomain: 'OLD_SESSION_DOMAIN',
  jwtDurations: {
    initialToken: 'JWT_DURATION_INITIAL',
    exchangedToken: 'JWT_DURATION_EXCHANGED',
    invitationToken: 'JWT_DURATION_INVIT',
    '2FAToken': 'JWT_DURATION_2FA',
  },
  admins: {
    __name: 'ADMINS',
    __format: 'json',
  },
  adminsOrg: {
    __name: 'ADMINS_ORG',
    __format: 'json',
  },
  admins2FA: {
    __name: 'ADMINS_2FA',
    __format: 'json',
  },
  roles: {
    defaults: {
      __name: 'ROLES_DEFAULTS',
      __format: 'json',
    },
    editable: 'ROLES_EDITABLE',
  },
  contact: 'CONTACT',
  homePage: 'HOME_PAGE',
  secret: {
    public: 'PUBLIC_KEY',
    private: 'PRIVATE_KEY',
  },
  storage: {
    type: 'STORAGE_TYPE',
    file: {
      users: 'STORAGE_FILE_USERS',
      organizations: 'STORAGE_FILE_ORGS',
    },
    mongo: {
      url: 'STORAGE_MONGO_URL',
    },
    ldap: {
      url: 'STORAGE_LDAP_URL',
      searchUserDN: 'STORAGE_LDAP_SEARCH_USER_DN',
      searchUserPassword: 'STORAGE_LDAP_SEARCH_USER_PASS',
      baseDN: 'STORAGE_LDAP_BASE_DN',
      readonly: {
        __name: 'STORAGE_LDAP_READONLY',
        __format: 'json',
      },
      users: {
        objectClass: 'STORAGE_LDAP_USERS_OBJECT_CLASS',
        dnKey: 'STORAGE_LDAP_USERS_DN_KEY',
        mapping: {
          __name: 'STORAGE_LDAP_USERS_MAPPING',
          __format: 'json',
        },
      },
      organizations: {
        staticSingleOrg: {
          __name: 'STORAGE_LDAP_ORGS_STATIC_SINGLE_ORG',
          __format: 'json',
        },
        objectClass: 'STORAGE_LDAP_ORGS_OBJECT_CLASS',
        dnKey: 'STORAGE_LDAP_ORGS_DN_KEY',
        mapping: {
          __name: 'STORAGE_LDAP_ORGS_MAPPING',
          __format: 'json',
        },
      },
      members: {
        organizationAsDC: {
          __name: 'STORAGE_LDAP_MEMBERS_ORG_AS_DC',
          __format: 'json',
        },
        onlyWithRole: {
          __name: 'STORAGE_LDAP_ONLY_WITH_ROLE',
          __format: 'json',
        },
        role: {
          attr: 'STORAGE_LDAP_MEMBERS_ROLE_ATTR',
          values: {
            __name: 'STORAGE_LDAP_MEMBERS_ROLE_VALUES',
            __format: 'json',
          },
          default: 'STORAGE_LDAP_MEMBERS_ROLE_DEFAULT',
        },
      },
    },
  },
  analytics: {
    __name: 'ANALYTICS',
    __format: 'json',
  },
  webhooks: {
    identities: {
      __name: 'IDENTITIES_WEBHOOKS',
      __format: 'json',
    },
  },
  theme: {
    logo: 'THEME_LOGO',
    favicon: 'THEME_FAVICON',
    dark: {
      __name: 'THEME_DARK',
      __format: 'json',
    },
    colors: {
      primary: 'THEME_PRIMARY',
      secondary: 'THEME_SECONDARY',
      accent: 'THEME_ACCENT',
      error: 'THEME_ERROR',
      info: 'THEME_INFO',
      success: 'THEME_SUCCESS',
      warning: 'THEME_WARNING',
    },
    darkColors: {
      primary: 'THEME_DARK_PRIMARY',
      secondary: 'THEME_DARK_SECONDARY',
      accent: 'THEME_DARK_ACCENT',
      error: 'THEME_DARK_ERROR',
      info: 'THEME_DARK_INFO',
      success: 'THEME_DARK_SUCCESS',
      warning: 'THEME_DARK_WARNING',
    },
    cssUrl: 'THEME_CSS_URL',
    cssText: 'THEME_CSS_TEXT',
  },
  i18n: {
    locales: {
      __name: 'I18N_LOCALES',
      __format: 'json',
    },
  },
  mails: {
    transport: {
      __name: 'MAILS_TRANSPORT',
      __format: 'json',
    },
    from: 'MAILS_FROM',
  },
  maildev: {
    url: 'MAILDEV_URL',
    active: {
      __name: 'MAILDEV_ACTIVE',
      __format: 'json',
    },
    smtp: 'MAILDEV_SMTP',
    web: 'MAILDEV_WEB',
  },
  quotas: {
    defaultMaxCreatedOrgs: {
      __name: 'DEFAULT_MAX_CREATED_ORGS',
      __format: 'json',
    },
    defaultMaxNbMembers: {
      __name: 'DEFAULT_MAX_NB_MEMBERS',
      __format: 'json',
    },
  },
  listEntitiesMode: 'LIST_ENTITIES_MODE',
  onlyCreateInvited: {
    __name: 'ONLY_CREATE_INVITED',
    __format: 'json',
  },
  userSelfDelete: {
    __name: 'USER_SELF_DELETE',
    __format: 'json',
  },
  defaultLoginRedirect: 'DEFAULT_LOGIN_REDIRECT',
  invitationRedirect: 'INVITATION_REDIRECT',
  secretKeys: {
    sendMails: 'SECRET_SENDMAILS',
    limits: 'SECRET_LIMITS',
    readAll: 'SECRET_READ_ALL',
    metrics: 'SECRET_METRICS',
  },
  listenWhenReady: {
    __name: 'LISTEN_WHEN_READY',
    __format: 'json',
  },
  noUI: {
    __name: 'NO_UI',
    __format: 'json',
  },
  tosUrl: 'TOS_URL',
  manageDepartments: {
    __name: 'MANAGE_DEPARTMENTS',
    __format: 'json',
  },
  manageDepartmentLabel: {
    __name: 'MANAGE_DEPARTMENT_LABEL',
    __format: 'json',
  },
  passwordless: {
    __name: 'PASSWORDLESS',
    __format: 'json',
  },
  authRateLimit: {
    attempts: {
      __name: 'AUTHRATELIMIT_ATTEMPTS',
      __format: 'json',
    },
    duration: {
      __name: 'AUTHRATELIMIT_DURATION',
      __format: 'json',
    },
  },
  oauth: {
    providers: {
      __name: 'OAUTH_PROVIDERS',
      __format: 'json',
    },
    github: {
      id: 'OAUTH_GITHUB_ID',
      secret: 'OAUTH_GITHUB_SECRET',
    },
    facebook: {
      id: 'OAUTH_FACEBOOK_ID',
      secret: 'OAUTH_FACEBOOK_SECRET',
    },
    google: {
      id: 'OAUTH_GOOGLE_ID',
      secret: 'OAUTH_GOOGLE_SECRET',
    },
    linkedin: {
      id: 'OAUTH_LINKEDIN_ID',
      secret: 'OAUTH_LINKEDIN_SECRET',
    },
  },
  noBirthday: {
    __name: 'NO_BIRTHDAY',
    __format: 'json',
  },
}
