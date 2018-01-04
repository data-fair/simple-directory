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
    findUsers: async function(params) {
      params = params || []
      let filteredUsers = users
      if (params.ids) {
        filteredUsers = filteredUsers.filter(user => (params.ids).find(id => user.id === id))
      }
      return {
        results: filteredUsers,
        count: filteredUsers.length
      }
    },
    getUserByEmail: async function(email) {
      return users.find(user => user.email === email)
    },
    getUserOrganizations: async function(userId) {
      return organizations.filter(organization => organization.members.find(member => member.id === userId))
    },
    findOrganizations: async function(params) {
      params = params || []
      let filteredOrganizations = organizations
      if (params.ids) {
        filteredOrganizations = filteredOrganizations.filter(organization => (params.ids).find(id => organization.id === id))
      }
      if (params['has-user']) {
        filteredOrganizations = filteredOrganizations.filter(organization => organization.members.find(member => member.id === params['has-user']))
      }
      return {
        results: filteredOrganizations,
        count: filteredOrganizations.length
      }
    }
  }
}
