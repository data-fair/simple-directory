const fs = require('fs')
const util = require('util')
// Convert fs.readFile into Promise version of same
const readFile = util.promisify(fs.readFile)

module.exports = async function(params) {
  const users = JSON.parse(await readFile(params.users, 'utf-8'))
  const organizations = JSON.parse(await readFile(params.organizations, 'utf-8'))
  return {
    getUserById: async function(id) {
      return users.find(user => user.id === id)
    },
    getUserByEmail: async function(email) {
      return users.find(user => user.email === email)
    },
    getUserOrganizations: async function(userId) {
      return organizations.filter(organization => organization.members.find(member => member.id === userId))
    },
    getOrganizationsByIds: async function(ids) {
      return organizations.filter(organization => ids.find(id => organization.id === id))
    }
  }
}
