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
  admins: jsonEnv('ADMINS'),
  adminsOrg: jsonEnv('ADMINS_ORG'),
  admins2FA: 'ADMINS_2FA',
  adminCredentials: jsonEnv('ADMIN_CREDENTIALS'),
  roles: {
    defaults: jsonEnv('ROLES_DEFAULTS')
  },
  manageRolesLabels: 'MANAGE_ROLES_LABELS',
  defaultRolesLabels: jsonEnv('DEFAULT_ROLES_LABELS'),
  contact: 'CONTACT',
  anonymousContactForm: 'ANONYMOUS_CONTACT_FORM',
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
      readonly: 'STORAGE_MONGO_READONLY',
      url: 'STORAGE_MONGO_URL',
      options: jsonEnv('STORAGE_MONGO_CLIENT_OPTIONS')
    },
    ldap: {
      url: 'STORAGE_LDAP_URL',
      clientOptions: jsonEnv('STORAGE_LDAP_CLIENT_OPTIONS'),
      searchUserDN: 'STORAGE_LDAP_SEARCH_USER_DN',
      searchUserPassword: 'STORAGE_LDAP_SEARCH_USER_PASS',
      overwrite: jsonEnv('STORAGE_LDAP_OVERWRITE_DB'),
      baseDN: 'STORAGE_LDAP_BASE_DN',
      cacheMS: 'STORAGE_LDAP_CACHE_MS',
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
        organization: {
          attr: 'STORAGE_LDAP_MEMBERS_ORG_ATTR',
          captureRegex: 'STORAGE_LDAP_MEMBERS_ORG_CAPTURE_REGEX'
        },
        onlyWithRole: 'STORAGE_LDAP_ONLY_WITH_ROLE',
        role: {
          attr: 'STORAGE_LDAP_MEMBERS_ROLE_ATTR',
          captureRegex: 'STORAGE_LDAP_MEMBERS_ROLE_CAPTURE_REGEX',
          values: jsonEnv('STORAGE_LDAP_MEMBERS_ROLE_VALUES'),
          default: 'STORAGE_LDAP_MEMBERS_ROLE_DEFAULT'
        },
        department: {
          attr: 'STORAGE_LDAP_MEMBERS_DEP_ATTR',
          captureRegex: 'STORAGE_LDAP_MEMBERS_DEP_CAPTURE_REGEX',
        },
        overwrite: jsonEnv('STORAGE_LDAP_MEMBERS_OVERWRITE')
      },
      isAdmin: {
        attr: 'STORAGE_LDAP_IS_ADMIN_ATTR',
        values: jsonEnv('STORAGE_LDAP_IS_ADMIN_VALUES')
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
    bodyFontFamily: 'THEME_BODY_FONT_FAMILY',
    bodyFontFamilyCss: 'THEME_BODY_FONT_FAMILY_CSS',
    headingFontFamily: 'THEME_HEADING_FONT_FAMILY',
    headingFontFamilyCss: 'THEME_HEADING_FONT_FAMILY_CSS',
    colors: {
      background: 'THEME_BACKGROUND',
      'on-background': 'THEME_ON_BACKGROUND',
      surface: 'THEME_SURFACE',
      'on-surface': 'THEME_ON_SURFACE',
      'surface-inverse': 'THEME_SURFACE_INVERSE',
      'on-surface-inverse': 'THEME_ON_SURFACE_INVERSE',
      primary: 'THEME_PRIMARY',
      'on-primary': 'THEME_ON_PRIMARY',
      'text-primary': 'THEME_TEXT_PRIMARY',
      secondary: 'THEME_SECONDARY',
      'on-secondary': 'THEME_ON_SECONDARY',
      'text-secondary': 'THEME_TEXT_SECONDARY',
      accent: 'THEME_ACCENT',
      'on-accent': 'THEME_ON_ACCENT',
      'text-accent': 'THEME_TEXT_ACCENT',
      error: 'THEME_ERROR',
      'on-error': 'THEME_ON_ERROR',
      'text-error': 'THEME_TEXT_ERROR',
      info: 'THEME_INFO',
      'on-info': 'THEME_ON_INFO',
      'text-info': 'THEME_TEXT_INFO',
      success: 'THEME_SUCCESS',
      'on-success': 'THEME_ON_SUCCESS',
      'text-success': 'THEME_TEXT_SUCCESS',
      warning: 'THEME_WARNING',
      'on-warning': 'THEME_ON_WARNING',
      'text-warning': 'THEME_TEXT_WARNING'
    },
    dark: 'THEME_DARK',
    darkColors: {
      background: 'THEME_DARK_BACKGROUND',
      'on-background': 'THEME_DARK_ON_BACKGROUND',
      surface: 'THEME_DARK_SURFACE',
      'on-surface': 'THEME_DARK_ON_SURFACE',
      primary: 'THEME_DARK_PRIMARY',
      'on-primary': 'THEME_DARK_ON_PRIMARY',
      'text-primary': 'THEME_DARK_TEXT_PRIMARY',
      secondary: 'THEME_DARK_SECONDARY',
      'on-secondary': 'THEME_DARK_ON_SECONDARY',
      'text-secondary': 'THEME_DARK_TEXT_SECONDARY',
      accent: 'THEME_DARK_ACCENT',
      'on-accent': 'THEME_DARK_ON_ACCENT',
      'text-accent': 'THEME_DARK_TEXT_ACCENT',
      error: 'THEME_DARK_ERROR',
      'on-error': 'THEME_DARK_ON_ERROR',
      'text-error': 'THEME_DARK_TEXT_ERROR',
      info: 'THEME_DARK_INFO',
      'on-info': 'THEME_DARK_ON_INFO',
      'text-info': 'THEME_DARK_TEXT',
      success: 'THEME_DARK_SUCCESS',
      'on-success': 'THEME_DARK_ON_SUCCESS',
      'text-success': 'THEME_DARK_TEXT_SUCCESS',
      warning: 'THEME_DARK_WARNING',
      'on-warning': 'THEME_DARK_ON_WARNING',
      'text-warning': 'THEME_DARK_TEXT_WARNING'
    },
    hc: 'THEME_HC',
    hcColors: {
      background: 'THEME_HC_BACKGROUND',
      'on-background': 'THEME_HC_ON_BACKGROUND',
      surface: 'THEME_HC_SURFACE',
      'on-surface': 'THEME_HC_ON_SURFACE',
      primary: 'THEME_HC_PRIMARY',
      'on-primary': 'THEME_HC_ON_PRIMARY',
      'text-primary': 'THEME_HC_TEXT_PRIMARY',
      secondary: 'THEME_HC_SECONDARY',
      'on-secondary': 'THEME_HC_ON_SECONDARY',
      'text-secondary': 'THEME_HC_TEXT_SECONDARY',
      accent: 'THEME_HC_ACCENT',
      'on-accent': 'THEME_HC_ON_ACCENT',
      'text-accent': 'THEME_HC_TEXT_ACCENT',
      error: 'THEME_HC_ERROR',
      'on-error': 'THEME_HC_ON_ERROR',
      'text-error': 'THEME_HC_TEXT_ERROR',
      info: 'THEME_HC_INFO',
      'on-info': 'THEME_HC_ON_INFO',
      'text-info': 'THEME_HC_TEXT_INFO',
      success: 'THEME_HC_SUCCESS',
      'on-success': 'THEME_HC_ON_SUCCESS',
      'text-success': 'THEME_HC_TEXT_SUCCESS',
      warning: 'THEME_HC_WARNING',
      'on-warning': 'THEME_HC_ON_WARNING',
      'text-warning': 'THEME_HC_TEXT'
    },
    hcDark: 'THEME_HC_DARK',
    hcDarkColors: {
      background: 'THEME_HC_DARK_BACKGROUND',
      'on-background': 'THEME_HC_DARK_ON_BACKGROUND',
      surface: 'THEME_HC_DARK_SURFACE',
      'on-surface': 'THEME_HC_DARK_ON_SURFACE',
      primary: 'THEME_HC_DARK_PRIMARY',
      'on-primary': 'THEME_HC_DARK_ON_PRIMARY',
      'text-primary': 'THEME_HC_DARK_TEXT_PRIMARY',
      secondary: 'THEME_HC_DARK_SECONDARY',
      'on-secondary': 'THEME_HC_DARK_ON_SECONDARY',
      'text-secondary': 'THEME_HC_DARK_TEXT_SECONDARY',
      accent: 'THEME_HC_DARK_ACCENT',
      'on-accent': 'THEME_HC_DARK_ON_ACCENT',
      'text-accent': 'THEME_HC_DARK_TEXT_ACCENT',
      error: 'THEME_HC_DARK_ERROR',
      'on-error': 'THEME_HC_DARK_ON_ERROR',
      'text-error': 'THEME_HC_DARK_TEXT_ERROR',
      info: 'THEME_HC_DARK_INFO',
      'on-info': 'THEME_HC_DARK_ON_INFO',
      'text-info': 'THEME_HC_DARK_TEXT_INFO',
      success: 'THEME_HC_DARK_SUCCESS',
      'on-success': 'THEME_HC_DARK_ON_SUCCESS',
      'text-success': 'THEME_HC_DARK_TEXT_SUCCESS',
      warning: 'THEME_HC_DARK_WARNING',
      'on-warning': 'THEME_HC_DARK_ON_WARNING',
      'text-warning': 'THEME_HC_DARK_TEXT_WARNING'
    }
  },
  i18n: {
    defaultLocale: 'I18N_DEFAULT_LOCALE',
    locales: jsonEnv('I18N_LOCALES')
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
    events: 'SECRET_EVENTS',
    sites: 'SECRET_SITES'
  },
  listenWhenReady: 'LISTEN_WHEN_READY',
  tosUrl: 'TOS_URL',
  manageDepartments: 'MANAGE_DEPARTMENTS',
  manageDepartmentLabel: 'MANAGE_DEPARTMENT_LABEL',
  defaultDepartmentLabel: 'DEFAULT_DEPARTMENT_LABEL',
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
  privateEventsUrl: 'PRIVATE_EVENTS_URL',
  plannedDeletionDelay: 'PLANNED_DELETION_DELAY',
  cleanup: {
    cron: 'CLEANUP_CRON',
    deleteInactive: 'CLEANUP_DELETE_INACTIVE',
    deleteInactiveDelay: jsonEnv('CLEANUP_DELETE_INACTIVE_DELAY')
  },
  alwaysAcceptInvitation: 'ALWAYS_ACCEPT_INVITATION',
  observer: {
    active: 'OBSERVER_ACTIVE',
    orgLevelMetrics: 'ORG_LEVEL_METRICS'
  },
  depAdminIsOrgAdmin: 'DEP_ADMIN_IS_ORG_ADMIN',
  manageSites: 'MANAGE_SITES',
  managePartners: 'MANAGE_PARTNERS',
  manageSessions: 'MANAGE_SESSIONS',
  defaultOrg: 'DEFAULT_ORG',
  passwordValidation: {
    entropy: 'PASSWORD_VALIDATION_ENTROPY',
    minLength: 'PASSWORD_VALIDATION_MIN_LENGTH',
    minCharClasses: 'PASSWORD_VALIDATION_MIN_CHAR_CLASSES',
  },
  passwordUpdateInterval: jsonEnv('PASSWORD_UPDATE_INTERVAL'),
  passwordValidateOnLogin: 'PASSWORD_VALIDATE_ON_LOGIN',
  siteOrgs: 'SITE_ORGS',
  siteAdmin: 'SITE_ADMIN',
  multiRoles: 'MULTI_ROLES',
  asAdmin: 'AS_ADMIN'
}
