module.exports = {
  port: 5689,
  publicUrl: 'http://localhost:5690',
  kid: 'simple-directory-default',
  secret: {
    public: './resources/keys/default.key.pub',
    private: './resources/keys/default.key'
  },
  jwt: {
    expiresIn: '30d'
  },
  storage: {
    type: 'file',
    params: {
      users: './resources/users.json',
      organizations: './resources/organizations.json'
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
    updateUserNames: [],
    updateOrganizationNames: []
  }
}
