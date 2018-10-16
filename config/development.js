module.exports = {
  port: 5689,
  publicUrl: 'http://localhost:5689',
  admins: ['alban.mouton@koumoul.com', 'alban.mouton@gmail.com'],
  homePage: 'https://koumoul.com',
  maildev: {
    active: true
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
  }
}
