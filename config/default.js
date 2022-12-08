module.exports = {
  port: 8080,
  noUI: false,
  publicUrl: 'http://localhost:8080',
  kid: 'simple-directory',
  secret: {
    public: './security/simple-directory.key.pub',
    private: './security/simple-directory.key'
  },
  oldSessionDomain: null, // used to cleanup cookies from older domain
  jwtDurations: {
    initialToken: '15m',
    exchangedToken: '30d',
    invitationToken: '10d',
    '2FAToken': '30d'
  },
  admins: ['admin@test.com'],
  adminsOrg: null,
  admins2FA: false,
  // special case where a email/password is defined at config level for a superadmin
  // useful when superadmins cannot be created in the storage (on-premise ldap with heavy constraints ?)
  // or to test stuff while email sending is not working yet, etc
  adminCredentials: null,
  roles: {
    defaults: ['admin', 'user'],
    editable: false
  },
  contact: 'contact@test.com',
  anonymousContactForm: false,
  anonymousAction: {
    expiresIn: '1d',
    notBefore: '8s'
  },
  homePage: null,
  storage: {
    // One of 'file', 'mongo' and 'ldap'
    type: 'mongo',
    file: {
      users: './data/users.json',
      organizations: './data/organizations.json'
    },
    mongo: {
      url: 'mongodb://mongo:27017/simple-directory-' + (process.env.NODE_ENV || 'development'),
      readonly: false
    },
    ldap: {
      url: 'ldap://ldap:389',
      searchUserDN: 'cn=admin,dc=example,dc=org',
      searchUserPassword: 'admin',
      baseDN: 'dc=example,dc=org',
      readonly: true,
      // map entities in ldap to SD users
      users: {
        objectClass: 'inetOrgPerson',
        dnKey: 'cn',
        mapping: {
          id: 'cn',
          name: 'cn',
          email: 'mail',
          firstName: 'givenName',
          lastName: 'sn',
          birthday: null,
          avatarUrl: null
        },
        // an array of objects that can be used to overwrite any user properties based on matching "email" property
        overwrite: [],
        // an array of string filters to add to the filters generated dy our ldap storage
        extraFilters: []
      },
      // map entities in ldap to SD organizations
      organizations: {
        // a single static organization, all users are in it
        // {id: ..., name: ...}
        staticSingleOrg: null,
        objectClass: 'organization',
        dnKey: 'dc',
        mapping: {
          id: 'dc',
          name: 'o'
        },
        // an array of objects that can be used to overwrite any org properties based on matching "id" property
        overwrite: [],
        // an array of string filters to add to the filters generated dy our ldap storage
        extraFilters: []
      },
      // manage the link between users and organizations
      members: {
        // organizations arr the parent DC of their users
        organizationAsDC: true,
        // only list users/members with a known role
        onlyWithRole: false,
        role: {
          attr: 'employeeType',
          /* values: {
            admin: ['administrator'],
            user: []
          }, */
          values: {},
          default: 'user'
        },
        // an array of objects that can be used to overwrite member role based on matching "orgId" and "email" properties
        // leave orgId empty to overwrite role for all organizations of the user
        overwrite: []
      }
    }
  },
  info: {
    termsOfService: 'https://koumoul.com/term-of-service',
    contact: {
      name: 'Koumoul',
      url: 'https://koumoul.com',
      email: 'support@koumoul.com'
    }
  },
  webhooks: {
    identities: []
  },
  analytics: {}, // a "modules" definition for @koumoul/vue-multianalytics
  theme: {
    logo: null,
    favicon: null,
    dark: false,
    colors: {
      // standard vuetify colors
      primary: '#1E88E5', // blue.darken1
      secondary: '#42A5F5', // blue.lighten1,
      accent: '#FF9800', // orange.base
      error: 'FF5252', // red.accent2
      info: '#2196F3', // blue.base
      success: '#4CAF50', // green.base
      warning: '#E91E63', // pink.base
      admin: '#E53935' // red.darken1
    },
    darkColors: {
      primary: '#2196F3', // blue.base
      success: '#00E676' // green.accent3
    },
    cssUrl: null,
    cssText: ''
  },
  i18n: {
    locales: ['fr', 'en', 'es', 'pt', 'it', 'de']
  },
  mails: {
    from: 'no-reply@test.com',
    // transport is a full configuration object for createTransport of nodemailer
    // cf https://nodemailer.com/smtp/
    transport: {
      port: 1025,
      ignoreTLS: true,
      default: 'localhost'
    },
    extraParams: {}
  },
  maildev: {
    url: 'http://localhost:1080',
    active: false,
    smtp: 1025,
    web: 1080
  },
  quotas: {
    defaultMaxCreatedOrgs: -1,
    defaultMaxNbMembers: 0
  },
  // Restricts who can use the find endpoints on users and organizations
  // One of 'anonymous', 'authenticated' or 'admin'
  listEntitiesMode: 'authenticated',
  listUsersMode: null, // same as listEntitiesMode but only for users
  listOrganizationsMode: null, // same as listEntitiesMode but only for users
  // Users can not be created at first email sent. They must be invited in an organization.
  // also they will not be able to log with personal account
  // and if removed from their last organization they will be deleted
  onlyCreateInvited: false,
  // users cannot delete their own account by default
  userSelfDelete: false,
  // Default redirection after login. If not specified user will go to his profile page.
  defaultLoginRedirect: null,
  // Redirect after successful invitation to an organization.
  // If not specified user will go to a dedicated page on simple-directory.
  invitationRedirect: null,
  // secrets that can be used to configure global webhooks for example to send emails to users
  secretKeys: {
    sendMails: null,
    limits: null,
    readAll: null,
    metrics: null,
    notifications: null
  },
  // A link to the terms of services for the site
  tosUrl: null,
  manageDepartments: false,
  manageDepartmentLabel: false,
  passwordless: true,
  authRateLimit: {
    attempts: 5,
    duration: 60
  },
  // Example of full oauth provider configuration
  // oauth: {providers: [{
  //   id: 'github',
  //   icon: 'mdi-github',
  //   title: 'GitHub',
  //   color: '#4078c0',
  //   scope: 'user:email'
  //   client: {
  //     id: '...',
  //     secret: '...'
  //   },
  //   auth: {
  //     tokenHost: 'https://github.com',
  //     tokenPath: '/login/oauth/access_token',
  //     authorizePath: '/login/oauth/authorize'
  //   }
  // }]}
  oauth: {
    providers: [],
    statesDir: './security',
    github: {
      id: '',
      secret: ''
    },
    facebook: {
      id: '',
      secret: ''
    },
    google: {
      id: '',
      secret: ''
    },
    linkedin: {
      id: '',
      secret: ''
    }
  },
  saml2: {
    providers: []
  },
  noBirthday: false,
  showCreatedUserHost: false,
  avatars: {
    users: true,
    orgs: true
  },
  // allow configuring external storages per organization
  perOrgStorageTypes: [],
  cipherPassword: null,
  notifyUrl: null,
  privateNotifyUrl: null,
  locks: {
    // in seconds
    ttl: 600
  },
  plannedDeletionDelay: 14,
  cleanup: {
    cron: '0 5 * * *',
    deleteInactive: false,
    deleteInactiveDelay: [3, 'years']
  },
  alwaysAcceptInvitation: false,
  prometheus: {
    active: true,
    port: 9090
  },
  // temporary option to prevent some regression
  depAdminIsOrgAdmin: false
}
