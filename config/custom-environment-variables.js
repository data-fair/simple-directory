module.exports = {
  publicUrl: 'PUBLIC_URL',
  kid: 'JWT_KID',
  jwt: {
    expiresIn: 'JWT_LIFETIME'
  },
  webhooks: {
    updateUserNames: {
      __name: 'USERNAMES_WEBHOOKS',
      __format: 'json'
    },
    updateOrganizationNames: {
      __name: 'ORGNAMES_WEBHOOKS',
      __format: 'json'
    }
  }
}
