const config = require('config')
const axios = require('axios')
const userName = require('./utils/user-name')

exports.sendUsersWebhooks = async (users) => {
  for (let user of users) {
    for (let webhook of config.webhooks.updateEntityNames) {
      await axios.post(webhook, {type: 'user', id: user.id, name: userName(user)})
    }
  }
}

exports.sendOrganizationsWebhooks = async (organizations) => {
  for (let organization of organizations) {
    for (let webhook of config.webhooks.updateEntityNames) {
      await axios.post(webhook, {type: 'organization', id: organization.id, name: organization.name})
    }
  }
}
