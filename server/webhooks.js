const config = require('config')
const axios = require('axios')
const userName = require('./utils/user-name')

exports.sendUsersWebhooks = async (users) => {
  for (let webhook of config.webhooks.updateUserNames) {
    await axios.post(webhook, users.map(user => ({id: user.id, name: userName(user)})))
  }
}

exports.sendOrganizationsWebhooks = async (organizations) => {
  for (let webhook of config.webhooks.updateOrganizationNames) {
    await axios.post(webhook, organizations.map(organization => ({id: organization.id, name: organization.name})))
  }
}
