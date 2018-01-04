const test = require('ava')
const axios = require('axios')
const fs = require('fs-extra')
const path = require('path')

const testDir = path.join(__dirname, '../')
const testFiles = fs.readdirSync(testDir).map(f => path.join(testDir, f))

exports.prepare = (testFile) => {
  const port = 5800 + testFiles.indexOf(testFile)
  process.env.NODE_CONFIG = JSON.stringify({
    port: port,
    publicUrl: 'http://localhost:' + port
  })
  const config = require('config')

  let app
  test.cb.before('run app', t => {
    app = require('../../server/app.js')
    app.on('listening', t.end)
  })

  return [test, config]
}

const axiosInstances = {}
exports.axios = async (testFile, email) => {
  const port = 5800 + testFiles.indexOf(testFile)
  const config = require('config')
  if (!email) {
    const ax = axios.create({baseURL: config.publicUrl})
    // customize axios errors for shorter stack traces when a request fails in a test
    ax.interceptors.response.use(response => response, error => {
      delete error.response.request
      return Promise.reject(error.response)
    })
    return ax
  }
  if (axiosInstances[email]) return axiosInstances[email]
  const res = await axios.post('http://localhost:' + port + '/api/auth/passwordless', {email}, {withCredentials: true})
  const idTokenCookie = res.headers['set-cookie'][0]
  const ax = axios.create({baseURL: config.publicUrl,
    headers: {
      'Cookie': idTokenCookie
    }})
  // customize axios errors for shorter stack traces when a request fails in a test
  ax.interceptors.response.use(response => response, error => {
    delete error.response.request
    return Promise.reject(error.response)
  })
  axiosInstances[email] = ax
  return ax
}
