module.exports = {
  port: 'PORT',
  publicUrl: 'PUBLIC_URL',
  kid: 'JWT_KID',
  jwt: {
    expiresIn: 'JWT_LIFETIME'
  },
  webhooks: {
    updateEntityNames: {
      __name: 'NAMES_WEBHOOKS',
      __format: 'json'
    }
  },
  brand: {
    logo: 'BRAND_LOGO',
    title: 'BRAND_TITLE',
    description: 'BRAND_DESCRIPTION'
  },
  mails: {
    transport: {
      __name: 'MAILS_TRANSPORT',
      __format: 'json'
    }
  },
  maildev: {
    active: {
      __name: 'MAILDEV_ACTIVE',
      __format: 'json'
    },
    smtp: 'MAILDEV_SMTP',
    web: 'MAILDEV_WEB'
  }
}
