const config = require('config')
const { promisify } = require('util')
const ldap = require('ldapjs')
const passwordsUtils = require('../utils/passwords')
const debug = require('debug')('ldap')

function sortCompare (sort) {
  return function (a, b) {
    for (const key of Object.keys(sort || {})) {
      if (a.item[key] < b.item[key]) return sort[key]
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
      if (obj.q) {
        filters.push(new ldap.SubstringFilter({ attribute: mapping.name, any: [obj.q] }))
      }
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
  async _search (client, base, filter, attributes, mappingFn, params = {}, onlyItem = true) {
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
    const skip = params.skip || 0
    const size = params.size || 20
    return {
      count: results.length,
      results: results
        .sort(sortCompare(params.sort))
        .slice(skip, skip + size)
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

  async createUser (user) {
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

  async deleteUser (id) {
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
      const overwrite = (this.ldapParams.members.overwrite || [])
        .find(o => (o.orgId === org.id || !o.orgId) && o.email === user.email)
      role = (overwrite && overwrite.role) || role || this.ldapParams.members.role.default
      user.organizations = [{ ...org, role }]
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
        {},
        false
      )
      if (!res.results[0]) return
      if (!onlyItem) return res.results[0]
      const user = res.results[0].item
      await this._setUserOrg(client, user, res.results[0].entry, res.results[0].attrs)
      const overwrite = (this.ldapParams.users.overwrite || []).find(o => o.email === user.email)
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
    const attributes = Object.values(this.ldapParams.users.mapping)
    const extraFilters = [...(this.ldapParams.users.extraFilters || [])]
    if (this.ldapParams.members.role.attr) {
      attributes.push(this.ldapParams.members.role.attr)
      if (this.ldapParams.members.onlyWithRole) {
        extraFilters.push(this._getRoleFilter(Object.keys(this.ldapParams.members.role.values)))
      }
    }
    return this._client(async (client) => {
      const res = await this._search(
        client,
        this.ldapParams.baseDN,
        this._userMapping.filter({ q: params.q }, this.ldapParams.users.objectClass, extraFilters),
        attributes,
        this._userMapping.from,
        params,
        false
      )
      const orgCache = {}
      for (let i = 0; i < res.results.length; i++) {
        const user = res.results[i].item
        await this._setUserOrg(client, user, res.results[i].entry, res.results[i].attrs, orgCache)
        const overwrite = this.ldapParams.users.overwrite.find(o => o.email === user.email)
        if (overwrite) Object.assign(user, overwrite)
        res.results[i] = user
      }
      return res
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
    let dn
    if (this.ldapParams.organizations.staticSingleOrg || this.org) {
      dn = this.ldapParams.baseDN
    } else if (this.ldapParams.members.organizationAsDC) {
      dn = this._orgDN({ id: organizationId })
    } else {
      // TODO
      throw new Error('Other type of link between user and organization is not implemented.')
    }

    if (dn) {
      const extraFilters = [...(this.ldapParams.users.extraFilters || [])]
      const attributes = Object.values(this.ldapParams.users.mapping)
      if (this.ldapParams.members.role.attr) {
        attributes.push(this.ldapParams.members.role.attr)
        if (params.roles && params.roles.length) {
          extraFilters.push(this._getRoleFilter(params.roles))
        } else if (this.ldapParams.members.onlyWithRole) {
          extraFilters.push(this._getRoleFilter(Object.keys(this.ldapParams.members.role.values)))
        }
      }
      return this._client(async (client) => {
        const res = await this._search(
          client,
          dn,
          this._userMapping.filter({ q: params.q }, this.ldapParams.users.objectClass, extraFilters),
          attributes,
          this._userMapping.from,
          params,
          false
        )
        const orgCache = {}
        for (let i = 0; i < res.results.length; i++) {
          const user = res.results[i].item
          await this._setUserOrg(client, user, res.results[i].entry, res.results[i].attrs, orgCache)
          const userOrga = user.organizations.find(o => o.id === organizationId)

          const member = { id: user.id, name: user.name, email: user.email, role: userOrga.role }
          if (userOrga.department) {
            member.departments = [{ id: userOrga.department, role: member.role }]
            delete member.role
          }
          res.results[i] = member
        }
        return res
      })
    }
  }

  async createOrganization (org) {
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

  async deleteOrganization (id) {
    const dn = this._orgDN({ id })
    debug('delete org from ldap', dn)
    await this._client(async (client) => {
      await client.del(dn)
    })
  }

  async _getOrganization (client, id) {
    if (this.ldapParams.organizations.staticSingleOrg) {
      if (this.ldapParams.organizations.staticSingleOrg.id === id) {
        return this.ldapParams.organizations.staticSingleOrg
      } else {
        return null
      }
    }
    const res = await this._search(
      client,
      this.ldapParams.baseDN,
      this._orgMapping.filter({ id }, this.ldapParams.organizations.objectClass, this.ldapParams.organizations.extraFilters),
      Object.values(this.ldapParams.organizations.mapping),
      this._orgMapping.from
    )
    const org = res.results[0]
    if (org) {
      const overwrite = this.ldapParams.organizations.overwrite.find(o => o.id === org.id)
      Object.assign(org, overwrite)
    }
    return res.results[0]
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
      return this._search(
        client,
        this.ldapParams.baseDN,
        this._orgMapping.filter({ q: params.q }, this.ldapParams.organizations.objectClass, extraFilters),
        Object.values(this.ldapParams.organizations.mapping),
        this._orgMapping.from,
        params
      )
    })
  }

  async required2FA (user) {
    if (user.adminMode && config.admins2FA) return true
    return false
  }

  async get2FA (userId) {
    return null
  }
}

exports.init = async (params, org) => new LdapStorage().init(params, org)
exports.readonly = config.storage.ldap.readonly
