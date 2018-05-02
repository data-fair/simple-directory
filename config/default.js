module.exports = {
  port: 8080,
  publicUrl: 'http://localhost:8080',
  kid: 'simple-directory',
  secret: {
    public: './resources/keys/default.key.pub',
    private: './resources/keys/default.key'
  },
  jwt: {
    expiresIn: '30d'
  },
  admins: ['admin@test.com'],
  storage: {
    type: 'file',
    file: {
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
    theme: {
      // standard vuetify colors
      primary: '#1E88E5', // blue.darken1
      secondary: '#42A5F5', // blue.lighten1,
      accent: '#E91E63', // pink.base
      error: 'FF5252', // red.accent2
      info: '#2196F3', // blue.base
      success: '#4CAF50', // green.base
      warning: '#FFC107' // amber.base
    }
  },
  defaultLocale: 'fr',
  mails: {
    from: 'no-reply@test.com',
    contact: 'contact@test.com',
    // transport is a full configuration object for createTransport of nodemailer
    // cf https://nodemailer.com/smtp/
    transport: {
      port: 1025,
      ignoreTLS: true
    }
  },
  maildev: {
    active: false,
    smtp: 1025,
    web: 1080
  }
}
