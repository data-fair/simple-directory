const fs = require('fs')
const util = require('util')
const userName = require('../utils/user-name')
const readFile = util.promisify(fs.readFile)

class FileStorage {
  async init(params) {
    this.readonly = true
    this.users = JSON.parse(await readFile(params.users, 'utf-8'))
    this.users.forEach(user => {
      user.name = userName(user)
    })
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
    if (params.q) {
      const lq = params.q.toLowerCase()
      filteredUsers = filteredUsers.filter(user => user.name.toLowerCase().indexOf(lq) >= 0)
    }
    return {
      count: filteredUsers.length,
      results: filteredUsers
    }
  }

  async findMembers(organizationId, params = {}) {
    const orga = this.organizations.find(o => o.id === organizationId)
    if (!orga) return null
    let members = orga.members
    if (params.q) {
      const lq = params.q.toLowerCase()
      members = members.filter(user => user.name.toLowerCase().indexOf(lq) >= 0)
    }
    return {
      count: members.length,
      results: members
    }
  }

  async getOrganization(id) {
    const orga = this.organizations.find(o => o.id === id)
    if (!orga) return null
    const cloneOrga = {...orga}
    delete cloneOrga.members
    return cloneOrga
  }

  async findOrganizations(params = {}) {
    let filteredOrganizations = this.organizations
    // For convenience in the files the members are stored in the organizations
    // But the actual model exposed is the contrary
    if (params.ids) {
      filteredOrganizations = filteredOrganizations.filter(organization => (params.ids).find(id => organization.id === id))
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
