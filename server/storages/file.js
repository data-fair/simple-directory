const fs = require('fs')
const util = require('util')
// Convert fs.readFile into Promise version of same
const readFile = util.promisify(fs.readFile)

class FileStorage {
  async init(params) {
    this.users = JSON.parse(await readFile(params.users, 'utf-8'))
    this.organizations = JSON.parse(await readFile(params.organizations, 'utf-8'))
    return this
  }

  async getUser(filter) {
    // Find user by strict equality of properties passed in filter
    const user = this.users.find(u => Object.keys(filter).reduce((a, f) => a && u[f] === filter[f], true))
    if (!user) return null

    // Find organizations that the user belongs to
    const orgas = this.organizations.filter(orga => orga.members.find(member => member.id === user.id))

    // Set these organizations ids, names and the role of the user in them
    return {...user,
      organizations: orgas.map(orga => ({
        id: orga.id,
        name: orga.name,
        role: orga.members.find(m => m.id === user.id).role
      }))}
  }

  async findUsers(params = {}) {
    let filteredUsers = this.users
    if (params.ids) {
      filteredUsers = filteredUsers.filter(user => (params.ids).find(id => user.id === id))
    }
    if (params.organization) {
      const orga = this.organizations.find(o => o.id === params.organization)
      if (!orga) filteredUsers = []
      else filteredUsers = filteredUsers.filter(user => (orga.members || []).find(m => m.id === user.id))
    }
    if (params.q) {
      const lq = params.q.toLowerCase()
      filteredUsers = filteredUsers.filter(user => user.firstName.toLowerCase().indexOf(lq) >= 0 || user.lastName.toLowerCase().indexOf(lq) >= 0)
    }
    return {
      count: filteredUsers.length,
      results: filteredUsers
    }
  }

  async findOrganizations(params = {}) {
    let filteredOrganizations = this.organizations
    // For convenience in the files the members are stored in the organizations
    // But the actual model exposed is the contrary
    if (params.ids) {
      filteredOrganizations = filteredOrganizations.filter(organization => (params.ids).find(id => organization.id === id))
    }
    if (params.member) {
      filteredOrganizations = filteredOrganizations.filter(organization => organization.members.find(member => member.id === params.member))
    }
    if (params.q) {
      const lq = params.q.toLowerCase()
      filteredOrganizations = filteredOrganizations.filter(organization => organization.name.toLowerCase().indexOf(lq) >= 0)
    }

    return {
      count: filteredOrganizations.length,
      results: filteredOrganizations.map(orga => {
        const cloneOrga = {...orga}
        delete cloneOrga.members
        return cloneOrga
      })
    }
  }
}

module.exports = async (params) => new FileStorage().init(params)
