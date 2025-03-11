module.exports = {
  mongo: {
    url: 'mongodb://localhost:27017/data-fair-' + (process.env.NODE_ENV || 'test')
  },
  port: 5690,
  publicUrl: 'http://localhost:5689/simple-directory',
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
      url: 'ldap://localhost:389',
      cacheMS: 0,
      searchUserDN: 'cn=admin,dc=example,dc=org',
      searchUserPassword: 'admin'
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
  },
  passwordValidation: {
    entropy: 40,
  }
}
