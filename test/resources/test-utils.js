const sdExpress = require('@data-fair/sd-express')

exports.axios = async (email) => {
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
