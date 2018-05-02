module.exports = {
  storage: {
    type: 'file',
    file: {
      users: './test/resources/users.json',
      organizations: './test/resources/organizations.json'
    },
    mongo: {
      url: 'mongodb://localhost:27017/data-fair-' + (process.env.NODE_ENV || 'development')
    }
  }
}
