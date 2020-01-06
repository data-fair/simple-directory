const path = require('path')
const fs = require('fs')
const util = require('util')
const userName = require('../utils/user-name')
const readFile = util.promisify(fs.readFile)

function applySelect(resources, select) {
  if (!select || !select.length) return resources
  return resources.map(resource => select.reduce((r, key) => { r[key] = resource[key]; return r }, {}))
}

function getUserOrgas(organizations, user) {
  return organizations
    .filter(orga => orga.members.find(member => member.id === user.id))
    .map(orga => ({
      ...orga.members.find(m => m.id === user.id),
      id: orga.id,
      name: orga.name
    }))
}

function sortCompare(sort) {
  return function(a, b) {
    for (let key of Object.keys(sort || {})) {
      if (a[key] < b[key]) return sort[key]
    }
    return 0
  }
}

class FileStorage {
  async init(params) {
    this.users = JSON.parse(await readFile(path.resolve(__dirname, '../..', params.users), 'utf-8'))
    this.users.forEach(user => {
      user.name = userName(user)
    })
    this.organizations = JSON.parse(await readFile(path.resolve(__dirname, '../..', params.organizations), 'utf-8'))
    this.organizations.forEach(orga => {
      orga.members = orga.members || []
      orga.departments = orga.departments || []
    })
    return this
  }

  cleanUser(user) {
    const res = { ...user, organizations: getUserOrgas(this.organizations, user) }
    delete res.password
    return res
  }

  async getUser(filter) {
    // Find user by strict equality of properties passed in filter
    const user = this.users.find(u => Object.keys(filter).reduce((a, f) => a && u[f] === filter[f], true))
    if (!user) return null

    // Set these organizations ids, names and the role of the user in them
    return this.cleanUser(user)
  }

  async getUserByEmail(email) {
    // Case insensitive comparison
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return null

    // Set these organizations ids, names and the role of the user in them
    return this.cleanUser(user)
  }

  async getPassword(userId) {
    // Case insensitive comparison
    const user = this.users.find(u => u.id === userId)
    if (!user) return null
    return user && user.password
  }

  async findUsers(params = {}) {
    let filteredUsers = this.users.map(user => this.cleanUser(user))
    if (params.ids) {
      filteredUsers = filteredUsers.filter(user => (params.ids).find(id => user.id === id))
    }
    if (params.q) {
      const lq = params.q.toLowerCase()
      filteredUsers = filteredUsers.filter(user => user.name.toLowerCase().indexOf(lq) >= 0)
    }

    filteredUsers = applySelect(filteredUsers, params.select)

    return {
      count: filteredUsers.length,
      results: filteredUsers.sort(sortCompare(params.sort)).slice(params.skip, params.skip + params.size)
    }
  }

  async findMembers(organizationId, params = {}) {
    const orga = this.organizations.find(o => o.id === organizationId)
    if (!orga) return null
    let members = orga.members.map(m => {
      const user = this.users.find(u => u.id === m.id)
      return { ...m, name: user.name, email: user.email }
    })
    if (params.q) {
      const lq = params.q.toLowerCase()
      members = members.filter(member => member.name.toLowerCase().indexOf(lq) >= 0)
    }
    if (params.ids && params.ids.length) {
      members = members.filter(member => params.ids.includes(member.id))
    }
    if (params.roles && params.roles.length) {
      members = members.filter(member => params.roles.includes(member.role))
    }
    if (params.departments && params.departments.length) {
      members = members.filter(member => params.departments.includes(member.department))
    }
    return {
      count: members.length,
      results: members.sort(sortCompare(params.sort)).slice(params.skip, params.skip + params.size)
    }
  }

  async getOrganization(id) {
    const orga = this.organizations.find(o => o.id === id)
    if (!orga) return null
    const cloneOrga = { ...orga }
    delete cloneOrga.members
    return cloneOrga
  }

  async findOrganizations(params = {}) {
    let filteredOrganizations = this.organizations.map(orga => {
      const cloneOrga = { ...orga }
      delete cloneOrga.members
      return cloneOrga
    })
    // For convenience in the files the members are stored in the organizations
    // But the actual model exposed is the contrary
    if (params.ids) {
      filteredOrganizations = filteredOrganizations.filter(organization => (params.ids).find(id => organization.id === id))
    }
    if (params.q) {
      const lq = params.q.toLowerCase()
      filteredOrganizations = filteredOrganizations.filter(organization => organization.name.toLowerCase().indexOf(lq) >= 0)
    }

    filteredOrganizations = applySelect(filteredOrganizations, params.select)

    return {
      count: filteredOrganizations.length,
      results: filteredOrganizations.sort(sortCompare(params.sort)).slice(params.skip, params.skip + params.size)
    }
  }
}

exports.init = async (params) => new FileStorage().init(params)
exports.readonly = true
