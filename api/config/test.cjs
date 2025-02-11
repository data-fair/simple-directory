module.exports = {
  mongo: {
    url: 'mongodb://localhost:27017/data-fair-' + (process.env.NODE_ENV || 'test')
  },
  port: 5690,
  publicUrl: 'http://localhost:5689/simple-directory',
  admins: ['admin@test.com'],
  contact: 'contact@test.com',
  storage: {
    type: 'file',
    file: {
      users: './dev/resources/users.json',
      organizations: './dev/resources/organizations.json'
    },
    mongo: {},
    ldap: {
      url: 'ldap://localhost:389',
      cacheMS: 0,
      searchUserDN: 'cn=admin,dc=example,dc=org',
      searchUserPassword: 'admin',
      members: {
        // organizations arr the parent DC of their users
        organizationAsDC: true,
        // only list users/members with a known role
        onlyWithRole: false,
        role: {
          attr: 'employeeType',
          values: {
            admin: ['administrator'],
            user: []
          },
          default: 'user'
        },
        department: {
          attr: 'departmentNumber',
          captureRegexp: '^.*/(.*)$'
        },
        // an array of objects that can be used to overwrite member role based on matching "orgId" and "email" properties
        // leave orgId empty to overwrite role for all organizations of the user
        overwrite: []
      }
    }
  },
  secretKeys: {
    sendMails: 'testkey',
    limits: 'testkey',
    readAll: 'testkey',
    metrics: 'testkey',
    events: 'testkey',
    sites: 'testkey'
  },
  authRateLimit: {
    attempts: 100,
    duration: 60
  },
  perOrgStorageTypes: ['ldap'],
  maildev: {
    active: true
  },
  manageSites: true,
  managePartners: true,
  cipherPassword: 'test',
  serveUi: false,
  observer: {
    active: false
  }
}
