module.exports = {
  port: 8080,
  mongo: {
    url: 'mongodb://mongo:27017/simple-directory-' + (process.env.NODE_ENV || 'development'),
    options: {}
  },
  publicUrl: 'http://localhost:8080',
  kid: 'sd',
  secret: { // DEPRECATED parameters, kept to transition to mongodb storage
    public: '/webapp/security/simple-directory.key.pub',
    private: '/webapp/security/simple-directory.key'
  },
  jwtDurations: {
    initialToken: '15m',
    exchangeToken: '30d',
    idToken: '15m',
    invitationToken: '10d',
    partnerInvitationToken: '10d',
    '2FAToken': '30d'
  },
  admins: ['admin@test.com'],
  adminsOrg: undefined,
  admins2FA: false,
  // special case where a email/password is defined at config level for a superadmin
  // useful when superadmins cannot be created in the storage (on-premise ldap with heavy constraints ?)
  // or to test stuff while email sending is not working yet, etc
  adminCredentials: undefined,
  roles: {
    defaults: ['admin', 'user']
  },
  contact: undefined,
  anonymousContactForm: false,
  anonymousAction: {
    expiresIn: '1d',
    notBefore: '8s'
  },
  homePage: undefined,
  storage: {
    // One of 'file', 'mongo' and 'ldap'
    type: 'mongo',
    file: {
      users: './data/users.json',
      organizations: './data/organizations.json'
    },
    mongo: {
      readonly: false
    },
    ldap: {
      url: 'ldap://ldap:389',
      searchUserDN: 'cn=admin,dc=example,dc=org',
      searchUserPassword: '',
      baseDN: 'dc=example,dc=org',
      readonly: true,
      // support storing overwritten properties in mongodb
      overwrite: ['members', 'departments', 'partners'],
      cacheMS: 1000 * 60 * 5, // 5 minutes
      // map entities in ldap to SD users
      users: {
        objectClass: 'inetOrgPerson',
        dnKey: 'cn',
        mapping: {
          id: 'cn',
          name: 'cn', // TODO: better to use userName ?
          email: 'mail',
          firstName: 'givenName',
          lastName: 'sn',
          // birthday: '',
          // avatarUrl: ''
        },
        // an array of objects that can be used to overwrite any user properties based on matching "email" property
        overwrite: [],
        // an array of string filters to add to the filters generated by our ldap storage
        extraFilters: []
      },
      // map entities in ldap to SD organizations
      organizations: {
        // a single static organization, all users are in it
        // {id: ..., name: ...}
        staticSingleOrg: undefined,
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
    logo: undefined,
    colors: {
      // standard vuetify colors, see https://vuetifyjs.com/en/styles/colors/#material-colors
      background: '#FFFFFF',
      'on-background': '#424242', // grey-darken-3
      surface: '#FFFFFF',
      'on-surface': '#424242', // grey-darken-3
      primary: '#1976D2', // blue.darken2
      'on-primary': '#FFFFFF', // white
      'text-primary': undefined, // same as primary by default
      secondary: '#90CAF9', // blue-lighten-3
      'on-secondary': '#000000',
      accent: '#DD2C00', // deep-orange-darken-4
      'on-accent': '#FFFFFF',
      error: '#D50000', // red-accent-4
      'on-error': '#FFFFFF',
      info: '#2962FF', // blue-accent-4
      'on-info': '#FFFFFF',
      success: '#2E7D32', // green-darken-3
      'on-success': '#FFFFFF',
      warning: '#D81B60', // pink-darken-1
      'on-warning': '#FFFFFF',
      admin: '#B71C1C', // red-darken-4
      'on-admin': '#FFFFFF',
    }
  },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en', 'es', 'pt', 'it', 'de']
  },
  mails: {
    from: 'no-reply@test.com',
    // transport is a full configuration object for createTransport of nodemailer
    // cf https://nodemailer.com/smtp/
    transport: {
      port: 1025,
      ignoreTLS: true,
      host: 'localhost'
    },
    extraParams: {}
  },
  maildev: {
    url: 'http://localhost:1080',
    active: false
  },
  quotas: {
    defaultMaxCreatedOrgs: -1,
    defaultMaxNbMembers: 0
  },
  // Restricts who can use the find endpoints on users and organizations
  // One of 'anonymous', 'authenticated' or 'admin'
  listEntitiesMode: 'authenticated',
  listUsersMode: undefined, // same as listEntitiesMode but only for users
  listOrganizationsMode: undefined, // same as listEntitiesMode but only for users
  // Users can not be created at first email sent. They must be invited in an organization.
  // also they will not be able to log with personal account
  // and if removed from their last organization they will be deleted
  onlyCreateInvited: false,
  // prevent inviting a user in multiple departments of the same organization
  singleMembership: false,
  // users cannot delete their own account by default
  userSelfDelete: false,
  // Default redirection after login. If not specified user will go to his profile page.
  defaultLoginRedirect: undefined,
  // Redirect after successful invitation to an organization.
  // If not specified user will go to a dedicated page on simple-directory.
  invitationRedirect: undefined,
  // secrets that can be used to configure global webhooks for example to send emails to users
  secretKeys: {
    sendMails: undefined,
    limits: undefined,
    readAll: undefined,
    metrics: undefined,
    notifications: undefined,
    sites: undefined
  },
  // A link to the terms of services for the site
  tosUrl: undefined,
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
  //   title: 'GitHub',
  //   icon: 'M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z',
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
    // certsDirectory: './security/saml2',
    // Accepts all samlify options for service providers https://samlify.js.org/#/sp-configuration
    sp: {},
    // providers have the usual title/color/icon/img attributes and all extra options accepted by samlify
    // for identify provider https://samlify.js.org/#/idp-configuration
    providers: []
  },
  oidc: {
    providers: []
  },
  noBirthday: false,
  avatars: {
    users: true,
    orgs: true
  },
  // allow configuring external storages per organization
  perOrgStorageTypes: [],
  cipherPassword: undefined,
  notifyUrl: undefined,
  privateNotifyUrl: undefined,
  plannedDeletionDelay: 14,
  cleanup: {
    cron: '0 5 * * *',
    deleteInactive: false,
    deleteInactiveDelay: [3, 'years']
  },
  alwaysAcceptInvitation: false,
  observer: {
    active: true
  },
  // temporary option to prevent some regression
  depAdminIsOrgAdmin: false,
  manageSites: false,
  managePartners: false,
  manageSessions: true,
  defaultOrg: undefined,
  serveUi: true
}
