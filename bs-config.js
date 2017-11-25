module.exports = {
  ui: {
    port: 5692,
    weinre: {
      port: 5691
    }
  },
  files: ['server/index.pug', 'public/bundles/*', 'public/styles/*', 'package.json'],
  watchOptions: {},
  server: false,
  proxy: 'localhost:5689',
  port: 5690,
  startPath: '/'
}
