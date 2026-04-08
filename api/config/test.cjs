require('dotenv').config({ quiet: true })

if (!process.env.DEV_API_PORT) throw new Error('missing DEV_API_PORT env variable, use "source dev/init-env.sh" to init .env file')

module.exports = {
  mongo: {
    url: 'mongodb://localhost:' + process.env.MONGO_PORT + '/simple-directory-' + (process.env.NODE_ENV || 'development')
  },
  port: process.env.DEV_API_PORT,
  publicUrl: 'http://' + (process.env.DEV_HOST || 'localhost') + ':' + process.env.NGINX_PORT1 + '/simple-directory',
  admins: ['admin@test.com'],
  adminCredentials: {
    email: '_superadmin@test.com',
    password: {
      // Test1234
      hash: '657cae4fd3026f325a48ae05da5980e74d4d841e1769ca54f47dc8733dfdd1d7c67196c1bcfc5e3e63b24b8572f6afea7f9347d7dbb489a9e55351a092901b4b',
      salt: 'b8b6f350af7c15fda9f6557fd8bf154a',
      iterations: 100000,
      size: 64,
      alg: 'sha512'
    }
  },
  contact: 'contact@test.com',
  storage: {
    type: 'file',
    file: {
      users: './dev/resources/users.json',
      organizations: './dev/resources/organizations.json'
    },
    mongo: {},
    ldap: {
      url: 'ldap://localhost:' + process.env.LDAP_PORT,
      cacheMS: 0,
      searchUserDN: 'cn=admin,dc=example,dc=org',
      searchUserPassword: 'admin',
      members: {
        // organizations are the parent DC of their users
        organizationAsDC: true,
        // only list users/members with a known role
        onlyWithRole: false,
        role: {
          attr: 'employeeType',
          captureRegex: '^(.{0,3}).*$',
          values: {
            admin: ['adm'],
            user: ['emp']
          },
          default: 'user'
        },
        department: {
          attr: 'departmentNumber',
          captureRegex: '^.*/(.*)$'
        },
        // an array of objects that can be used to overwrite member role based on matching "orgId" and "email" properties
        // leave orgId empty to overwrite role for all organizations of the user
        overwrite: []
      },
      prefillCache: false
    }
  },
  secretKeys: {
    sendMails: 'testkey',
    limits: 'testkey',
    readAll: 'testkey',
    metrics: 'testkey',
    events: 'testkey',
    sites: 'testkey',
    pseudoSession: 'testkey'
  },
  authRateLimit: {
    attempts: 100,
    duration: 60
  },
  perOrgStorageTypes: ['ldap'],
  mails: {
    from: 'no-reply@test.com',
    transport: {
      port: parseInt(process.env.MAILDEV_SMTP_PORT || '1025'),
      ignoreTLS: true,
      host: 'localhost'
    },
    extraParams: {}
  },
  maildev: {
    active: true,
    url: 'http://localhost:' + (process.env.MAILDEV_UI_PORT),
  },
  manageSites: true,
  managePartners: true,
  cipherPassword: 'test',
  observer: {
    active: false,
    port: process.env.DEV_OBSERVER_PORT
  },
  passwordValidation: {
    entropy: 40,
    minLength: 8,
    minCharClasses: 3
  },
  passwordUpdateInterval: [1, 'days']
}
