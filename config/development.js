module.exports = {
  port: 5689,
  publicUrl: 'http://localhost:5689',
  // use this host when debugging a data-fair inside a virtualbox vm
  // publicUrl: 'http://10.0.2.2:5689',
  admins: ['alban.mouton@koumoul.com', 'alban.mouton@gmail.com', 'superadmin@test.com'],
  adminsOrg: { id: 'admins-org', name: `Admins organization` },
  homePage: 'https://koumoul.com',
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
    }
  },
  webhooks: {
    identities: [{ base: 'http://test-koumoul.com/identities', key: 'somesecret' }]
  },
  tosUrl: 'https://test.com',
  manageDepartments: true
  // passwordless: false
}
