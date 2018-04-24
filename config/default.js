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
    updateEntityNames: []
  },
  brand: {
    logo: null,
    title: 'Simple Directory',
    description: 'Manage and authenticate your users.',
    theme: {
      // standard vuetify colors
      primary: '#1E88E5', // blue.darken1
      secondary: '#42A5F5', // blue.lighten1,
      accent: '#E91E63', // pink.base
      error: 'FF5252', // red.accent2
      info: '#2196F3', // blue.base
      success: '#4CAF50', // green.base
      warning: '#FFC107', // amber.base
      // other colors
      logo1: '#2196F3',
      logo2: '#BBDEFB'
    }
  }
}
