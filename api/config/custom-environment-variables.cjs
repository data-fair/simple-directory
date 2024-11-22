/**
 * @param {string} key
 */
const jsonEnv = (key) => ({ __name: key, __format: 'json' })

module.exports = {
  port: 'PORT',
  mongo: {
    url: 'MONGO_URL',
    options: jsonEnv('MONGO_OPTIONS')
  },
  publicUrl: 'PUBLIC_URL',
  kid: 'JWT_KID',
  jwtDurations: {
    initialToken: 'JWT_DURATION_INITIAL',
    idToken: 'JWT_DURATION_ID',
    exchangeToken: 'JWT_DURATION_EXCHANGE',
    invitationToken: 'JWT_DURATION_INVIT',
    partnerInvitationToken: 'JWT_DURATION_PARTNER_INVIT',
    '2FAToken': 'JWT_DURATION_2FA'
  },
  admins: {
    __name: 'ADMINS',
    __format: 'json'
  },
  adminsOrg: 'ADMINS_ORG',
  admins2FA: 'ADMINS_2FA',
  adminCredentials: jsonEnv('ADMIN_CREDENTIALS'),
  roles: {
    defaults: jsonEnv('ROLES_DEFAULTS')
  },
  contact: 'CONTACT',
  anonymousAction: {
    expiresIn: 'ANONYMOUS_ACTION_EXPIRES_IN',
    notBefore: 'ANONYMOUS_ACTION_NOT_BEFORE'
  },
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
      readonly: 'STORAGE_MONGO_READONLY'
    },
    ldap: {
      url: 'STORAGE_LDAP_URL',
      searchUserDN: 'STORAGE_LDAP_SEARCH_USER_DN',
      searchUserPassword: 'STORAGE_LDAP_SEARCH_USER_PASS',
      baseDN: 'STORAGE_LDAP_BASE_DN',
      users: {
        objectClass: 'STORAGE_LDAP_USERS_OBJECT_CLASS',
        dnKey: 'STORAGE_LDAP_USERS_DN_KEY',
        mapping: jsonEnv('STORAGE_LDAP_USERS_MAPPING'),
        overwrite: jsonEnv('STORAGE_LDAP_USERS_OVERWRITE'),
        extraFilters: jsonEnv('STORAGE_LDAP_USERS_EXTRA_FILTERS')
      },
      organizations: {
        staticSingleOrg: jsonEnv('STORAGE_LDAP_ORGS_STATIC_SINGLE_ORG'),
        objectClass: 'STORAGE_LDAP_ORGS_OBJECT_CLASS',
        dnKey: 'STORAGE_LDAP_ORGS_DN_KEY',
        mapping: jsonEnv('STORAGE_LDAP_ORGS_MAPPING'),
        overwrite: jsonEnv('STORAGE_LDAP_ORGS_OVERWRITE'),
        extraFilters: jsonEnv('STORAGE_LDAP_ORGS_EXTRA_FILTERS')
      },
      members: {
        organizationAsDC: 'STORAGE_LDAP_MEMBERS_ORG_AS_DC',
        onlyWithRole: 'STORAGE_LDAP_ONLY_WITH_ROLE',
        role: {
          attr: 'STORAGE_LDAP_MEMBERS_ROLE_ATTR',
          values: jsonEnv('STORAGE_LDAP_MEMBERS_ROLE_VALUES'),
          default: 'STORAGE_LDAP_MEMBERS_ROLE_DEFAULT'
        },
        overwrite: jsonEnv('STORAGE_LDAP_MEMBERS_OVERWRITE')
      }
    }
  },
  analytics: jsonEnv('ANALYTICS'),
  webhooks: {
    identities: jsonEnv('IDENTITIES_WEBHOOKS')
  },
  theme: {
    logo: 'THEME_LOGO',
    favicon: 'THEME_FAVICON',
    colors: {
      background: 'THEME_BACKGROUND',
      surface: 'THEME_SURFACE',
      primary: 'THEME_PRIMARY',
      secondary: 'THEME_SECONDARY',
      accent: 'THEME_ACCENT',
      error: 'THEME_ERROR',
      info: 'THEME_INFO',
      success: 'THEME_SUCCESS',
      warning: 'THEME_WARNING'
    }
  },
  i18n: {
    defaultLocale: 'I18N_DEFAULT_LOCALE',
    locales: {
      __name: 'I18N_LOCALES',
      __format: 'json'
    }
  },
  mails: {
    transport: jsonEnv('MAILS_TRANSPORT'),
    from: 'MAILS_FROM',
    extraParams: jsonEnv('MAILS_EXTRA_PARAMS')
  },
  maildev: {
    url: 'MAILDEV_URL',
    active: 'MAILDEV_ACTIVE'
  },
  quotas: {
    defaultMaxCreatedOrgs: 'DEFAULT_MAX_CREATED_ORGS',
    defaultMaxNbMembers: 'DEFAULT_MAX_NB_MEMBERS'
  },
  listEntitiesMode: 'LIST_ENTITIES_MODE',
  listUsersMode: 'LIST_USERS_MODE',
  listOrganizationsMode: 'LIST_ORGANIZATIONS_MODE',
  onlyCreateInvited: 'ONLY_CREATE_INVITED',
  singleMembership: 'SINGLE_MEMBERSHIP',
  userSelfDelete: 'USER_SELF_DELETE',
  defaultLoginRedirect: 'DEFAULT_LOGIN_REDIRECT',
  invitationRedirect: 'INVITATION_REDIRECT',
  secretKeys: {
    sendMails: 'SECRET_SENDMAILS',
    limits: 'SECRET_LIMITS',
    readAll: 'SECRET_READ_ALL',
    metrics: 'SECRET_METRICS',
    notifications: 'SECRET_NOTIFICATIONS',
    sites: 'SECRET_SITES'
  },
  listenWhenReady: 'LISTEN_WHEN_READY',
  tosUrl: 'TOS_URL',
  manageDepartments: 'MANAGE_DEPARTMENTS',
  manageDepartmentLabel: 'MANAGE_DEPARTMENT_LABEL',
  passwordless: 'PASSWORDLESS',
  authRateLimit: {
    attempts: 'AUTHRATELIMIT_ATTEMPTS',
    duration: 'AUTHRATELIMIT_DURATION'
  },
  oauth: {
    providers: jsonEnv('OAUTH_PROVIDERS'),
    github: {
      id: 'OAUTH_GITHUB_ID',
      secret: 'OAUTH_GITHUB_SECRET'
    },
    facebook: {
      id: 'OAUTH_FACEBOOK_ID',
      secret: 'OAUTH_FACEBOOK_SECRET'
    },
    google: {
      id: 'OAUTH_GOOGLE_ID',
      secret: 'OAUTH_GOOGLE_SECRET'
    },
    linkedin: {
      id: 'OAUTH_LINKEDIN_ID',
      secret: 'OAUTH_LINKEDIN_SECRET'
    }
  },
  saml2: {
    sp: jsonEnv('SAML2_SP'),
    providers: jsonEnv('SAML2_PROVIDERS')
  },
  oidc: {
    providers: jsonEnv('OIDC_PROVIDERS')
  },
  noBirthday: 'NO_BIRTHDAY',
  avatars: {
    users: 'AVATARS_USERS',
    orgs: 'AVATARS_ORGS'
  },
  perOrgStorageTypes: jsonEnv('PER_ORG_STORAGE_TYPES'),
  cipherPassword: 'CIPHER_PASSWORD',
  notifyUrl: 'NOTIFY_URL',
  privateNotifyUrl: 'PRIVATE_NOTIFY_URL',
  plannedDeletionDelay: 'PLANNED_DELETION_DELAY',
  cleanup: {
    cron: 'CLEANUP_CRON',
    deleteInactive: 'CLEANUP_DELETE_INACTIVE',
    deleteInactiveDelay: 'CLEANUP_DELETE_INACTIVE_DELAY'
  },
  alwaysAcceptInvitation: 'ALWAYS_ACCEPT_INVITATION',
  observer: {
    active: 'OBSERVER_ACTIVE'
  },
  depAdminIsOrgAdmin: 'DEP_ADMIN_IS_ORG_ADMIN',
  manageSites: 'MANAGE_SITES',
  managePartners: 'MANAGE_PARTNERS',
  defaultOrg: 'DEFAULT_ORG'
}
