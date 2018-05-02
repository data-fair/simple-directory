module.exports = {
  port: 5689,
  publicUrl: 'http://localhost:5689',
  admins: ['alban.mouton@koumoul.com'],
  maildev: {
    active: true
  },
  storage: {
    type: 'mongo',
    mongo: {
      url: 'mongodb://localhost:27017/data-fair-' + (process.env.NODE_ENV || 'development')
    }
  }
}
