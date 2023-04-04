module.exports = {
  port: 5690,
  publicUrl: 'http://127.0.0.1:5689/simple-directory',
  secret: {
    public: './test/resources/test.key.pub',
    private: './test/resources/test.key'
  },
  admins: ['admin@test.com', 'alban.mouton@koumoul.com'],
  storage: {
    type: 'file',
    file: {
      users: './test/resources/users.json',
      organizations: './test/resources/organizations.json'
    },
    mongo: {
      url: 'mongodb://localhost:27017/data-fair-' + (process.env.NODE_ENV || 'test')
    },
    ldap: {
      url: 'ldap://localhost:389',
      cacheMS: 0
    }
  },
  secretKeys: {
    sendMails: 'testkey',
    limits: 'testkey',
    readAll: 'testkey',
    metrics: 'testkey',
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
  noUI: false,
  manageSites: true,
  managePartners: true
}
