const test = require('ava')
const fs = require('fs-extra')
const path = require('path')
const sdExpress = require('@koumoul/sd-express')

const testDir = path.join(__dirname, '../')
const testFiles = fs.readdirSync(testDir).map(f => path.join(testDir, f))

exports.prepare = (testFile) => {
  const port = 5800 + testFiles.indexOf(testFile)
  const smtpPort = 1030 + testFiles.indexOf(testFile)
  process.env.NODE_ENV = 'test'
  process.env.PORT = port
  process.env.PUBLIC_URL = 'http://localhost:' + port
  process.env.MAILDEV_ACTIVE = true
  process.env.MAILDEV_SMTP = smtpPort
  process.env.MAILDEV_WEB = 1090 + testFiles.indexOf(testFile)
  process.env.MAILS_TRANSPORT = JSON.stringify({ port: smtpPort, ignoreTLS: true })
  const config = require('config')

  let app
  test.before('run app', async t => {
    app = require('../../server/app.js')
    test.app = await app.run()
  })

  test.after('stop app', async t => {
    await app.stop()
  })

  return { test, config }
}

exports.axios = async (test, email) => {
  const config = require('config')
  const ax = await sdExpress.axiosAuth(email, null, { baseURL: config.publicUrl }, config.publicUrl, config.maildev.url)

  // Simpler data associated to failure for cleaner logs
  ax.interceptors.response.use(response => response, error => {
    if (error.response && error.response.status < 500) return error.response
    // console.log(error.response)
    if (error.response) return Promise.reject(new Error(`${error.response.status}: ${error.response.data}`))
    return Promise.reject(error)
  })

  return ax
}
