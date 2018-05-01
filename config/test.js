module.exports = {
  storage: {
    type: 'file',
    params: {
      users: './test/resources/users.json',
      organizations: './test/resources/organizations.json'
    }
  },
  mails: {
    maildev: true
  }
}
