const config = require('config')
const axios = require('axios')
const userName = require('./utils/user-name')
const debug = require('debug')('webhooks')
exports.sendUsersWebhooks = async (users) => {
  for (let user of users) {
    const name = userName(user)
    for (let webhook of config.webhooks.identities) {
      debug('Send user name webhook to ' + webhook.base, name)
      try {
        await axios.post(`${webhook.base}/user/${user.id}`, { name })
      } catch (err) {
        console.error('Failure in webhook ' + webhook.base, err)
      }
    }
  }
}

exports.sendOrganizationsWebhooks = async (organizations) => {
  for (let organization of organizations) {
    for (let webhook of config.webhooks.identities) {
      debug('Send organization name webhook to ' + webhook.base, organization.name)
      try {
        await axios.post(`${webhook.base}/organization/${organization.id}`, { name: organization.name })
      } catch (err) {
        console.error('Failure in webhook ' + webhook.base, err)
      }
    }
  }
}
