module.exports = {
  port: 'PORT',
  publicUrl: 'PUBLIC_URL',
  kid: 'JWT_KID',
  jwtDurations: {
    initialToken: 'JWT_DURATION_INITIAL',
    echangedToken: 'JWT_DURATION_EXCHANGED',
    invitationToken: 'JWT_DURATION_INVIT'
  },
  admins: {
    __name: 'ADMINS',
    __format: 'json'
  },
  storage: {
    type: 'STORAGE_TYPE',
    file: {
      users: 'STORAGE_FILE_USERS',
      organizations: 'STORAGE_FILE_ORGS'
    },
    mongo: {
      url: 'STORAGE_MONGO_URL'
    }
  },
  webhooks: {
    updateEntityNames: {
      __name: 'NAMES_WEBHOOKS',
      __format: 'json'
    }
  },
  brand: {
    logo: 'BRAND_LOGO'

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
