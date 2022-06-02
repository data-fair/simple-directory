const config = require('config')
const axios = require('axios')
const userName = require('./utils/user-name')
const debug = require('debug')('webhooks')

exports.postIdentity = async (type, identity) => {
  const name = type === 'user' ? userName(identity) : identity.name
  const body = { name }
  if (type === 'user' && identity.organizations) body.organizations = identity.organizations
  for (const webhook of config.webhooks.identities) {
    const url = `${webhook.base}/${type}/${identity.id}`
    debug(`Send identity name webhook to ${url} : `, body)
    try {
      await axios.post(url, body, { params: { key: webhook.key } })
    } catch (err) {
      console.error('Failure in webhook ' + url, err.body || err.message || err)
    }
  }
}

exports.deleteIdentity = async (type, id) => {
  for (const webhook of config.webhooks.identities) {
    const url = `${webhook.base}/${type}/${id}`
    debug(`Send identity delete webhook to ${url}`)
    try {
      await axios.delete(url, { params: { key: webhook.key } })
    } catch (err) {
      console.error('Failure in webhook ' + url, err.body || err.message || err)
    }
  }
}
