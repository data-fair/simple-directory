module.exports = {
  mongo: {
    url: 'mongodb://localhost:27017/data-fair-' + (process.env.NODE_ENV || 'test')
  },
  port: 5690,
  publicUrl: 'http://localhost:5689/simple-directory',
  admins: ['admin@test.com', 'alban.mouton@koumoul.com'],
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
  oidc: {
    providers: [{
      title: 'Test OIDC IDP',
      color: '#288E35',
      img: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
      discovery: 'http://localhost:9009/.well-known/openid-configuration',
      client: {
        id: 'foo',
        secret: 'bar'
      }
    }]
  },
  managePartners: true,
  cipherPassword: 'test'
}
