const sdExpress = require('@data-fair/sd-express')
const axios = require('axios')
const eventToPromise = require('event-to-promise')
const assert = require('assert').strict
const mails = require('../server/mails')

exports.axios = async (email, org = null) => {
  const config = require('config')
  const opts = { baseURL: config.publicUrl, maxRedirects: 0 }
  let ax
  if (email) ax = await sdExpress.axiosAuth(email, org, opts, config.publicUrl, config.maildev.url)
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
  const anonymAx = await exports.axios()
  const mailPromise = eventToPromise(mails.events, 'send')
  await anonymAx.post('/api/users', { email, password })
  const mail = await mailPromise
  // sent a mail with a token_callback url to validate user creation
  assert.ok(mail.link.includes('token_callback'))
  await anonymAx(mail.link).catch(err => { if (err.status !== 302) throw err })
  const ax = await exports.axios(email + ':' + password + (adminMode ? ':adminMode' : ''))
  const user = (await ax.get('/api/auth/me')).data
  return { ax, user }
}
