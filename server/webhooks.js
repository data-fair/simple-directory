const config = require('config')
const axios = require('axios')
const userName = require('./utils/user-name')
const debug = require('debug')('webhooks')
exports.sendUsersWebhooks = async (users) => {
  for (let user of users) {
    const payload = {type: 'user', id: user.id, name: userName(user)}
    for (let webhook of config.webhooks.updateEntityNames) {
      debug('Send user name webhook to ' + webhook, payload)
      try {
        await axios.post(webhook, payload)
      } catch (err) {
        console.error('Failure in webhook ' + webhook, err)
      }
    }
  }
}

exports.sendOrganizationsWebhooks = async (organizations) => {
  for (let organization of organizations) {
    const payload = {type: 'organization', id: organization.id, name: organization.name}
    for (let webhook of config.webhooks.updateEntityNames) {
      debug('Send organization name webhook to ' + webhook, payload)
      try {
        await axios.post(webhook, payload)
      } catch (err) {
        console.error('Failure in webhook ' + webhook, err)
      }
    }
  }
}
