module.exports = {
  secret: {
    public: './test/resources/test.key.pub',
    private: './test/resources/test.key',
  },
  admins: ['alban.mouton@koumoul.com'],
  storage: {
    type: 'file',
    file: {
      users: './test/resources/users.json',
      organizations: './test/resources/organizations.json',
    },
    mongo: {
      url: 'mongodb://localhost:27017/data-fair-' + (process.env.NODE_ENV || 'development'),
    },
    ldap: {
      url: 'ldap://localhost:389',
      readonly: false,
    },
  },
  secretKeys: {
    sendMails: 'testkey',
    limits: 'testkey',
    readAll: 'testkey',
    metrics: 'testkey',
  },
  authRateLimit: {
    attempts: 100,
    duration: 60,
  },
}
