const sdExpress = require('@data-fair/sd-express')
const axios = require('axios')

exports.axios = async (email) => {
  const config = require('config')
  const opts = { baseURL: config.publicUrl }
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
