const config = require('config')
const { promisify } = require('util')
const ldap = require('ldapjs')
const passwordsUtils = require('../utils/passwords')
const mongoUtils = require('../utils/mongo')
const memoize = require('memoizee')
const debug = require('debug')('ldap')

function sortCompare (sort) {
  return function (a, b) {
    for (const key of Object.keys(sort || {})) {
      if (a[key] > b[key]) return sort[key]
      if (a[key] < b[key]) return sort[key] * -1
    }
    return 0
  }
}

function buildMappingFn (mapping, required, multiValued, objectClass, secondaryObjectClass, prefixes) {
  return {
    from (attrs) {
      const result = {}
      Object.keys(mapping).forEach(key => {
        if (attrs[mapping[key]] && attrs[mapping[key]][0]) {
          const values = attrs[mapping[key]].map(v => {
            return (prefixes[key] || '') + v
          })
          if (multiValued.includes(key)) {
            result[key] = values
          } else {
            result[key] = values[0]
          }
        } else if (required.includes(key)) {
          throw new Error(`${key} attribute is required, ldap attr=${mapping[key]}`)
        }
      })
      return result
    },
    to (obj) {
      const entry = { objectClass: secondaryObjectClass ? [objectClass, secondaryObjectClass] : objectClass }
      Object.keys(mapping).forEach(key => {
        if (obj[key] && (!multiValued.includes(key) || obj[key].length)) {
          entry[mapping[key]] = obj[key] && obj[key].replace(prefixes[key] || '', '')
        } else if (required.includes(key)) {
          throw new Error(`${key} attribute is required`)
        }
      })
      return entry
    },
    filter (obj, objectClass, extraFilters = []) {
      const filters = [new ldap.EqualityFilter({ attribute: 'objectClass', value: objectClass })]
      Object.keys(obj)
        .filter(key => !!obj[key])
        .filter(key => !!mapping[key])
        .forEach(key => {
          filters.push(new ldap.EqualityFilter({ attribute: mapping[key], value: obj[key].replace(prefixes[key] || '', '') }))
        })
      for (const extraFilter of extraFilters) {
        filters.push(typeof extraFilter === 'string' ? ldap.parseFilter(extraFilter) : extraFilter)
      }
      for (const key of required) {
        filters.push(new ldap.PresenceFilter({ attribute: mapping[key] }))
      }
      if (filters.length === 1) return filters[0]
      return new ldap.AndFilter({ filters })
    }
  }
}

class LdapStorage {
  async init (params, org) {
    this.ldapParams = params
    this.org = org
    console.log('Connecting to ldap ' + params.url)
    // check connexion at startup
    await this._client(async (client) => {})
    const prefixes = org ? { id: `ldap_${org.id}_` } : {}
    this._userMapping = buildMappingFn(
      this.ldapParams.users.mapping,
      ['email'],
      [],
      this.ldapParams.users.objectClass,
      null,
      prefixes
    )
    if (!this.org) {
      this._orgMapping = buildMappingFn(
        this.ldapParams.organizations.mapping,
        ['id'],
        [],
        this.ldapParams.organizations.objectClass,
        this.ldapParams.members.organizationAsDC ? 'dcObject' : null,
        {}
      )
    }

    if (config.storage.mongo.url && (this.ldapParams.overwrite || []).includes('members')) {
      console.log('Connecting to mongodb ' + config.storage.mongo.url)
      const MongoClient = require('mongodb').MongoClient
      try {
        this.mongoClient = await MongoClient.connect(config.storage.mongo.url)
      } catch (err) {
      // 1 retry after 1s
      // solve the quite common case in docker-compose of the service starting at the same time as the db
        await new Promise(resolve => setTimeout(resolve, 1000))
        this.mongoClient = await MongoClient.connect(config.storage.mongo.url)
      }

      this.db = this.mongoClient.db()
      await mongoUtils.ensureIndex(this.db, 'ldap-members-overwrite', { orgId: 1, userId: 1 }, { name: 'main-keys', unique: true })
      await mongoUtils.ensureIndex(this.db, 'ldap-organizations-overwrite', { id: 1 }, { name: 'main-keys', unique: true })
    } else {
      console.log('LDAP without mongodb overwriting capabilities')
    }

    this._getAllUsers = memoize(async (client) => {
      const attributes = Object.values(this.ldapParams.users.mapping)
      const extraFilters = [...(this.ldapParams.users.extraFilters || [])]
      if (this.ldapParams.members.role.attr) {
        attributes.push(this.ldapParams.members.role.attr)
      }
      if (this.ldapParams.members.onlyWithRole) {
        extraFilters.push(this._getRoleFilter(Object.keys(this.ldapParams.members.role.values)))
      }
      const res = await this._search(
        client,
        this.ldapParams.baseDN,
        this._userMapping.filter({}, this.ldapParams.users.objectClass, extraFilters),
        attributes,
        this._userMapping.from,
        false
      )
      return res
    }, { maxAge: config.storage.ldap.cacheMS }) // 5 minutes cache

    return this
  }

  async _client (fn) {
    const client = ldap.createClient({ url: this.ldapParams.url, timeout: 4000 })
    client.on('error', err => console.error(err.message))

    client.bind = promisify(client.bind)
    client.unbind = promisify(client.unbind)
    client.add = promisify(client.add)
    client.del = promisify(client.del)
    debug('bind service account', this.ldapParams.url, this.ldapParams.searchUserDN)
    await client.bind(this.ldapParams.searchUserDN, passwordsUtils.decipherPassword(this.ldapParams.searchUserPassword))
    const promise = fn(client)
    promise.finally(() => client.unbind())
    return promise
  }

  // promisified search
  async _search (client, base, filter, attributes, mappingFn, onlyItem = true) {
    const results = await new Promise((resolve, reject) => {
      client.search(base, {
        filter,
        attributes: attributes.filter(key => !!key),
        scope: 'sub',
        paged: true
      }, (err, res) => {
        if (err) return reject(err)
        const results = []
        res.on('searchEntry', (entry) => {
          const attrs = {}
          entry.attributes.forEach(attr => {
            attrs[attr.type] = attr._vals.map(v => v.toString())
          })
          try {
            results.push({ entry, attrs, item: mappingFn(attrs) })
          } catch (err) {
            debug(err.message, entry)
          }
        })
        res.on('error', (err) => {
          if (err.lde_message && err.lde_message === 'No Such Object') {
            return resolve([])
          }
          debug('reject search query', err)
          reject(err)
        })
        res.on('end', () => resolve(results))
      })
    })

    debug(`search results
  - base: ${base}
  - filter: ${filter}
  - attributes: ${JSON.stringify(attributes)}
  - nb results: ${results.length}
  - first result: `, results[0])
    return {
      count: results.length,
      results: results
        .map(result => onlyItem ? result.item : result)
    }
  }

  _userDN (user) {
    const entry = this._userMapping.to(user)
    const dnKey = this.ldapParams.users.dnKey
    if (!entry[dnKey]) throw new Error(`La clé ${dnKey} est obligatoire`)
    if (this.ldapParams.organizations.staticSingleOrg || this.org) {
      return `${dnKey}=${entry[dnKey]}, ${this.ldapParams.baseDN}`
    } else if (this.ldapParams.members.organizationAsDC) {
      if (!user.organizations || !user.organizations.length) {
        throw new Error('L\'utilisateur doit être associé à une organisation dès la création')
      }
      const orgEntry = this._orgMapping.to(user.organizations[0])
      const orgDNKey = this.ldapParams.organizations.dnKey
      if (!orgEntry[orgDNKey]) throw new Error(`La clé ${orgDNKey} est obligatoire dans l'organisation`)
      return `${dnKey}=${entry[dnKey]}, ${orgDNKey}=${orgEntry[orgDNKey]}, ${this.ldapParams.baseDN}`
    } else {
      return `${dnKey}=${entry[dnKey]}, ${this.ldapParams.baseDN}`
    }
  }

  _orgDN (org) {
    const entry = this._orgMapping.to(org)
    const dnKey = this.ldapParams.organizations.dnKey
    if (!entry[dnKey]) throw new Error(`La clé ${dnKey} est obligatoire`)
    return `${dnKey}=${entry[dnKey]}, ${this.ldapParams.baseDN}`
  }

  async _setUserOrg (client, user, entry, attrs, orgCache = {}) {
    let org
    if (this.ldapParams.organizations.staticSingleOrg) {
      org = this.ldapParams.organizations.staticSingleOrg
    } else if (this.org) {
      org = { id: this.org.id, name: this.org.name }
    } else if (this.ldapParams.members.organizationAsDC) {
      const dn = ldap.parseDN(entry.objectName)
      const orgDC = dn.rdns[1].attrs.dc.value
      orgCache[orgDC] = orgCache[orgDC] || await this._getOrganization(client, orgDC)
      org = orgCache[orgDC]
    } else {
      // TODO
    }

    if (org) {
      let role
      if (this.ldapParams.members.role.attr) {
        const ldapRoles = attrs[this.ldapParams.members.role.attr]
        if (ldapRoles) {
          role = Object.keys(this.ldapParams.members.role.values)
            .find(role => !!ldapRoles.find(ldapRole => this.ldapParams.members.role.values[role].includes(ldapRole)))
        }
      }
      let overwrite
      if ((this.ldapParams.overwrite || []).includes('members')) {
        overwrite = await this.db.collection('ldap-members-overwrite').findOne({ orgId: org.id, userId: user.id })
      }
      overwrite = overwrite || (this.ldapParams.members.overwrite || [])
        .find(o => (o.orgId === org.id || !o.orgId) && o.email?.toLowerCase() === user.email?.toLowerCase())

      role = (overwrite && overwrite.role) || role || this.ldapParams.members.role.default
      const department = overwrite ? overwrite.department : org.department
      user.organizations = [{ ...org, role, department }]
    }
  }

  async _getUser (filter, onlyItem = true) {
    debug('search single user', filter)
    const attributes = Object.values(this.ldapParams.users.mapping)
    if (this.ldapParams.members.role.attr) attributes.push(this.ldapParams.members.role.attr)
    return this._client(async (client) => {
      const res = await this._search(
        client,
        this.ldapParams.baseDN,
        this._userMapping.filter(filter, this.ldapParams.users.objectClass, this.ldapParams.users.extraFilters),
        attributes,
        this._userMapping.from,
        false
      )
      if (!res.results[0]) return
      if (!onlyItem) return res.results[0]
      const user = res.results[0].item
      await this._setUserOrg(client, user, res.results[0].entry, res.results[0].attrs)
      const overwrite = (this.ldapParams.users.overwrite || []).find(o => o.email?.toLowerCase() === user.email?.toLowerCase())
      if (overwrite) Object.assign(user, overwrite)
      if (this.org) user.orgStorage = true
      return user
    })
  }

  async getUser (filter) {
    return this._getUser(filter)
  }

  async getUserByEmail (email) {
    return this._getUser({ email })
  }

  async checkPassword (id, password) {
    const user = await this._getUser({ id }, false)
    if (!user) return
    const dn = user.entry.objectName

    const client = ldap.createClient({ url: this.ldapParams.url, reconnect: false, timeout: 4000 })
    client.bind = promisify(client.bind)
    client.unbind = promisify(client.unbind)
    try {
      debug('try to bind user', dn)
      await client.bind(dn, password)
      return true
    } catch (err) {
      debug('auth failure', id, err)
      return false
    } finally {
      client.unbind()
    }
  }

  // ids, q, sort, select, skip, size
  async findUsers (params = {}) {
    debug('find users', params)
    return this._client(async (client) => {
      let results = (await this._getAllUsers(client)).results.slice()
      const orgCache = {}
      for (let i = 0; i < results.length; i++) {
        const user = results[i].item
        await this._setUserOrg(client, user, results[i].entry, results[i].attrs, orgCache)
        const overwrite = (this.ldapParams.users.overwrite || []).find(o => o.email === user.email)
        if (overwrite) Object.assign(user, overwrite)
        // email is implicitly confirmed in ldap mode
        user.emailConfirmed = true
        results[i] = user
      }
      if (params.ids) {
        results = results.filter(user => (params.ids).find(id => user.id === id))
      }
      if (params.q) {
        const lq = params.q.toLowerCase()
        results = results.filter(user => user.name.toLowerCase().indexOf(lq) >= 0)
      }
      results.sort(sortCompare(params.sort))
      const count = results.length
      const skip = params.skip || 0
      const size = params.size || 20
      results = results.slice(skip, skip + size)
      return { count, results }
    })
  }

  _getRoleFilter (roles) {
    let roleAttrValues = []
    roles.forEach(role => {
      roleAttrValues = roleAttrValues.concat(this.ldapParams.members.role.values[role] || (role === this.ldapParams.members.role.default ? [] : [role]))
    })
    if (roleAttrValues.length) {
      const roleAttrFilters = roleAttrValues.map(value => new ldap.EqualityFilter({ attribute: this.ldapParams.members.role.attr, value }))
      if (roleAttrFilters.length > 1) {
        // roleFilter = `(|${roleAttrFilters.join('')})`
        return new ldap.OrFilter({ filters: roleAttrFilters })
      } else {
        return roleAttrFilters[0]
      }
    }
  }

  async findMembers (organizationId, params = {}) {
    debug('find members', params)
    const users = (await this.findUsers({ ...params, sort: null, skip: 0, size: 10000 })).results
    let members = users
      .filter(user => user.organizations.find(o => o.id === organizationId))
      .map(user => {
        const userOrga = user.organizations.find(o => o.id === organizationId)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: userOrga.role,
          department: userOrga.department,
          emailConfirmed: true
        }
      })
    if (params.roles && params.roles.length) {
      members = members.filter(member => params.roles.includes(member.role))
    }
    if (params.departments && params.departments.length) {
      members = members.filter(member => params.departments.includes(member.department))
    }
    members.sort(sortCompare(params.sort))
    const count = members.length
    const skip = params.skip || 0
    const size = params.size || 20
    members = members.slice(skip, skip + size)
    return {
      count,
      results: members
    }
  }

  async addMember (orga, user, role, department) {
    if (!(this.ldapParams.overwrite || []).includes('members')) throw new Error('ldap members overwrite not supported')
    await this.db.collection('ldap-members-overwrite').replaceOne(
      { orgId: orga.id, userId: user.id },
      { orgId: orga.id, department, userId: user.id, role },
      { upsert: true }
    )
  }

  async patchMember (orgId, userId, department = null, patch) {
    if (!(this.ldapParams.overwrite || []).includes('members')) throw new Error('ldap members overwrite not supported')
    await this.db.collection('ldap-members-overwrite').replaceOne(
      { orgId, userId },
      { ...patch, orgId, userId },
      { upsert: true }
    )
  }

  async removeMember (orgId, userId) {
    if (!(this.ldapParams.overwrite || []).includes('members')) throw new Error('ldap members overwrite not supported')
    await this.db.collection('ldap-members-overwrite')
      .deleteOne({ orgId, userId })
  }

  async _getOrganization (client, id) {
    let org
    if (this.ldapParams.organizations.staticSingleOrg) {
      if (this.ldapParams.organizations.staticSingleOrg.id === id) {
        org = this.ldapParams.organizations.staticSingleOrg
      }
    } else {
      const res = await this._search(
        client,
        this.ldapParams.baseDN,
        this._orgMapping.filter({ id }, this.ldapParams.organizations.objectClass, this.ldapParams.organizations.extraFilters),
        Object.values(this.ldapParams.organizations.mapping),
        this._orgMapping.from
      )
      org = res.results[0]
    }
    if (org) {
      let overwrite
      if ((this.ldapParams.overwrite || []).includes('organizations') || (this.ldapParams.overwrite || []).includes('departments')) {
        overwrite = await this.db.collection('ldap-organizations-overwrite').findOne({ id: org.id })
      }
      overwrite = overwrite || (this.ldapParams.organizations.overwrite || []).find(o => (o.id === org.id))
      if (overwrite) Object.assign(org, overwrite)
      org.departments = org.departments || []
    }
    return org
  }

  async getOrganization (id) {
    return this._client(async (client) => {
      return this._getOrganization(client, id)
    })
  }

  async findOrganizations (params = {}) {
    debug('find orgs', params)
    if (this.ldapParams.organizations.staticSingleOrg) {
      return {
        count: 1,
        results: [this.ldapParams.organizations.staticSingleOrg]
      }
    }
    const extraFilters = [...(this.ldapParams.organizations.extraFilters || [])]
    return this._client(async (client) => {
      const res = this._search(
        client,
        this.ldapParams.baseDN,
        this._orgMapping.filter({ q: params.q }, this.ldapParams.organizations.objectClass, extraFilters),
        Object.values(this.ldapParams.organizations.mapping),
        this._orgMapping.from
      )
      res.results.sort(sortCompare(params.sort))
      return res
    })
  }

  async patchOrganization (id, patch, user) {
    if (!((this.ldapParams.overwrite || []).includes('organizations') || (this.ldapParams.overwrite || []).includes('departments'))) {
      throw new Error('ldap organizations overwrite not supported')
    }
    patch.updated = { id: user.id, name: user.name, date: new Date() }
    patch.id = id
    await this.db.collection('ldap-organizations-overwrite').findOneAndUpdate(
      { id },
      { $set: patch },
      { upsert: true }
    )
    return await this.getOrganization(id)
  }

  async required2FA (user) {
    if (user.adminMode && config.admins2FA) return true
    return false
  }

  async get2FA (userId) {
    return null
  }

  // WARNING: the following is used only in tests as ldap storage is always readonly
  // except for the overwritten properties stored in mongo

  async _createUser (user) {
    const entry = this._userMapping.to({ ...user, lastName: user.lastName || 'missing' })
    const dn = this._userDN(user)
    if (user.organizations.length && this.ldapParams.members.role.attr) {
      const roleValues = this.ldapParams.members.role.values[user.organizations[0].role]
      const roleValue = roleValues && roleValues[0]
      entry[this.ldapParams.members.role.attr] = roleValue || this.ldapParams.members.role.default
    }

    debug('add user to ldap', dn, entry)
    await this._client(async (client) => {
      await client.add(dn, entry)
    })
    return user
  }

  async _deleteUser (id) {
    const user = await this._getUser({ id }, false)
    if (!user) {
      debug('delete user not found')
      return
    }
    const dn = user.entry.objectName
    debug('delete user from ldap', dn)
    await this._client(async (client) => {
      await client.del(dn)
    })
  }

  async _createOrganization (org) {
    const entry = this._orgMapping.to(org)
    const dn = this._orgDN(org)

    // dc is in the dn string, not as an attribute
    delete entry.dc

    debug('add org to ldap', dn, entry)
    await this._client(async (client) => {
      await client.add(dn, entry)
    })
    return org
  }

  async _deleteOrganization (id) {
    const dn = this._orgDN({ id })
    debug('delete org from ldap', dn)
    await this._client(async (client) => {
      await client.del(dn)
    })
  }
}

exports.init = async (params, org) => new LdapStorage().init(params, org)
exports.readonly = true
exports.overwrite = config.storage.ldap.overwrite
