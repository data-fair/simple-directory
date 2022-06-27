const sdExpress = require('@data-fair/sd-express')
const axios = require('axios')
const eventToPromise = require('event-to-promise')
const assert = require('assert').strict
const mails = require('../server/mails')

exports.axios = async (email) => {
  const config = require('config')
  const opts = { baseURL: config.publicUrl, maxRedirects: 0 }
  let ax
  if (email) ax = await sdExpress.axiosAuth(email, null, opts, config.publicUrl, config.maildev.url)
  else ax = axios.create(opts)

  // customize axios errors for shorter stack traces when a request fails in a test
  ax.interceptors.response.use(response => response, error => {
    if (!error.response) return Promise.reject(error)
    delete error.response.request
    return Promise.reject(error.response)
  })

  return ax
}

exports.createUser = async (email, adminMode = false, password = 'Test1234') => {
  const ax = await exports.axios()
  const mailPromise = eventToPromise(mails.events, 'send')
  const user = await ax.post('/api/users', { email, password })
  const mail = await mailPromise
  // sent a mail with a token_callback url to validate user creation
  assert.ok(mail.link.includes('token_callback'))
  await ax(mail.link).catch(err => { if (err.status !== 302) throw err })

  return { user, ax: await exports.axios(email + ':' + password + (adminMode ? ':adminMode' : '')) }
}
