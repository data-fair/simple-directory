module.exports = {
  port: 5689,
  publicUrl: 'http://localhost:5689',
  // use this host when debugging a data-fair inside a virtualbox vm
  // publicUrl: 'http://10.0.2.2:5689',
  admins: ['alban.mouton@koumoul.com', 'alban.mouton@gmail.com', 'superadmin@test.com'],
  adminsOrg: { id: 'admins-org', name: 'Admins organization' },
  admins2FA: false,
  homePage: 'https://koumoul.com',
  anonymousContactForm: true,
  jwtDurations: {
    initialToken: '5m',
    // exchangedToken: '5m',
    invitationToken: '5m'
  },
  i18n: {
    locales: ['fr', 'en', 'es', 'it', 'pt', 'de']
  },
  maildev: {
    active: true
  },
  mails: {
    from: 'no-reply@test.com',
    // transport is a full configuration object for createTransport of nodemailer
    // cf https://nodemailer.com/smtp/
    transport: {}
  },
  secret: {
    public: './test/resources/test.key.pub',
    private: './test/resources/test.key'
  },
  storage: {
    type: 'mongo',
    file: {
      users: './test/resources/users.json',
      organizations: './test/resources/organizations.json'
    },
    mongo: {
      url: 'mongodb://localhost:27017/simple-directory-' + (process.env.NODE_ENV || 'development')
    },
    ldap: {
      url: 'ldap://localhost:389'
    }
  },
  webhooks: {
    identities: [{ base: 'http://test-koumoul.com/identities', key: 'somesecret' }]
  },
  tosUrl: 'https://test.com',
  manageDepartments: true,
  quotas: {
    defaultMaxCreatedOrgs: 1
    // defaultMaxNbMembers: 0
  },
  passwordless: false,
  userSelfDelete: true,
  secretKeys: {
    sendMails: 'testkey',
    limits: 'testkey',
    readAll: 'testkey',
    metrics: 'testkey',
    notifications: 'secret-notifications'
  },
  showCreatedUserHost: true,
  proxyNuxt: true,
  perOrgStorageTypes: ['ldap'],
  cipherPassword: 'dev',
  notifyUrl: 'http://localhost:5689/notify',
  privateNotifyUrl: 'http://localhost:8088',
  plannedDeletionDelay: 1,
  locks: {
    // in seconds
    ttl: 20
  },
  cleanup: {
    // cron: '*/1 * * * *',
    deleteInactive: true,
    deleteInactiveDelay: [1, 'days']
  },
  alwaysAcceptInvitation: true
}
