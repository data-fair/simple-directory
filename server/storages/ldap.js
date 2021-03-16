const { promisify } = require('util')
const ldap = require('ldapjs')
const memoize = require('memoizee')
const debug = require('debug')('ldap')

// TODO: should we sanititze user inputs to prevent injection ?

function assertSafe(key) {
  if (key.includes(',') || key.includes('=')) {
    debug('unsafe key', key)
    throw new Error('Les caractères , et = sont interdits dans certaines propriétés.')
  }
  return key
}

function sortCompare(sort) {
  return function(a, b) {
    for (let key of Object.keys(sort || {})) {
      if (a.item[key] < b.item[key]) return sort[key]
    }
    return 0
  }
}

function buildMappingFn(mapping, required, multiValued, objectClass, secondaryObjectClass) {
  return {
    from (attrs) {
      const result = {}
      Object.keys(mapping).forEach(key => {
        if (attrs[mapping[key]] && attrs[mapping[key]][0]) {
          if (multiValued.includes(key)) {
            result[key] = attrs[mapping[key]]
          } else {
            result[key] = attrs[mapping[key]][0]
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
          entry[mapping[key]] = obj[key]
        } else if (required.includes(key)) {
          throw new Error(`${key} attribute is required`)
        }
      })
      return entry
    },
    filter (obj, objectClass, extraFilter) {
      const parts = [`(objectClass=${objectClass})`]
        .concat(Object.keys(obj)
          .filter(key => !!obj[key])
          .filter(key => !!mapping[key])
          .map(key => `(${mapping[key]}=${assertSafe(obj[key])})`)
        )
      if (obj.q) {
        parts.push(`(${mapping.name}=*${assertSafe(obj.q)}*)`)
      }
      if (extraFilter) {
        parts.push(extraFilter)
      }
      if (parts.length === 1) return parts[0]
      const filter = `(&${parts.join('')})`
      debug('ldap filter', obj, objectClass, filter)
      return filter
    }
  }
}

async function boundClient(params) {
  const client = ldap.createClient({ url: params.url, reconnect: true, timeout: 4000 })
  debug('ldap client created', params.url)
  client.bind = promisify(client.bind)
  client.add = promisify(client.add)
  client.del = promisify(client.del)
  debug('bind service account', params.searchUserDN)
  await client.bind(params.searchUserDN, params.searchUserPassword)
  debug('service account bound')
  return client
}

class LdapStorage {
  async init(params) {
    this.ldapParams = params
    console.log('Connecting to ldap ' + params.url)
    try {
      this.client = await boundClient(params)
    } catch (err) {
      // 1 retry after 1s
      // solve the quite common case in docker-compose of the service starting at the same time as the db
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.client = await boundClient(params)
    }

    this._userMapping = buildMappingFn(
      this.ldapParams.users.mapping,
      ['email'],
      [],
      this.ldapParams.users.objectClass
    )
    this._orgMapping = buildMappingFn(
      this.ldapParams.organizations.mapping,
      ['id'],
      [],
      this.ldapParams.organizations.objectClass,
      this.ldapParams.members.organizationAsDC ? 'dcObject' : null
    )

    // memoized getOrganization to support the join done when fetching members
    this._getOrganizationMem = memoize((id) => this.getOrganization(id), { maxAge: 10000 })

    return this
  }

  // promisified search
  async _search (base, filter, attributes, mappingFn, params = {}, onlyItem = true) {
    const results = await new Promise((resolve, reject) => {
      this.client.search(base, {
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
            console.error(err)
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

    debug('search results', base, filter, results)
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

  _userDN(user) {
    const entry = this._userMapping.to(user)
    const dnKey = this.ldapParams.users.dnKey
    if (!entry[dnKey]) throw new Error(`La clé ${dnKey} est obligatoire`)
    if (this.ldapParams.organizations.staticSingleOrg) {
      return `${dnKey}=${entry[dnKey]}, ${this.ldapParams.baseDN}`
    } else if (this.ldapParams.members.organizationAsDC) {
      if (!user.organizations || !user.organizations.length) {
        throw new Error(`L'utilisateur doit être associé à une organisation dès la création`)
      }
      const orgEntry = this._orgMapping.to(user.organizations[0])
      const orgDNKey = this.ldapParams.organizations.dnKey
      if (!orgEntry[orgDNKey]) throw new Error(`La clé ${orgDNKey} est obligatoire dans l'organisation`)
      return `${dnKey}=${entry[dnKey]}, ${orgDNKey}=${orgEntry[orgDNKey]}, ${this.ldapParams.baseDN}`
    } else {
      return `${dnKey}=${entry[dnKey]}, ${this.ldapParams.baseDN}`
    }
  }

  _orgDN(org) {
    const entry = this._orgMapping.to(org)
    const dnKey = this.ldapParams.organizations.dnKey
    if (!entry[dnKey]) throw new Error(`La clé ${dnKey} est obligatoire`)
    return `${dnKey}=${entry[dnKey]}, ${this.ldapParams.baseDN}`
  }

  async createUser(user) {
    const entry = this._userMapping.to(user)
    const dn = this._userDN(user)
    if (user.organizations.length && this.ldapParams.members.role.attr) {
      const roleValues = this.ldapParams.members.role.values[user.organizations[0].role]
      const roleValue = roleValues && roleValues[0]
      entry[this.ldapParams.members.role.attr] = roleValue || this.ldapParams.members.role.default
    }

    debug('add user to ldap', dn, entry)
    await this.client.add(dn, entry)
    return user
  }

  async deleteUser(id) {
    const user = await this._getUser({ id }, false)
    if (!user) return
    const dn = user.entry.objectName
    debug('delete user from ldap', dn)
    await this.client.del(dn)
  }

  async _setUserOrg(user, entry, attrs) {
    let org
    if (this.ldapParams.organizations.staticSingleOrg) {
      org = this.ldapParams.organizations.staticSingleOrg
    } else if (this.ldapParams.members.organizationAsDC) {
      const dn = ldap.parseDN(entry.objectName)
      const orgDC = dn.rdns[1].attrs.dc.value
      org = await this._getOrganizationMem(orgDC)
    } else {
      // TODO
    }

    if (org) {
      let role
      if (this.ldapParams.members.role.attr) {
        const ldapRoles = attrs[this.ldapParams.members.role.attr]
        if (ldapRoles) {
          role = Object.keys(this.ldapParams.members.role.values).find(role => {
            return !!ldapRoles.find(ldapRole => this.ldapParams.members.role.values[role].includes(ldapRole))
          })
        }
      }
      role = role || this.ldapParams.members.role.default
      user.organizations = [{ ...org, role }]
    }
  }

  async _getUser(filter, onlyItem = true) {
    const attributes = Object.values(this.ldapParams.users.mapping)
    if (this.ldapParams.members.role.attr) attributes.push(this.ldapParams.members.role.attr)
    const res = await this._search(
      this.ldapParams.baseDN,
      this._userMapping.filter(filter, this.ldapParams.users.objectClass),
      attributes,
      this._userMapping.from,
      {},
      false
    )
    if (!res.results[0]) return
    if (!onlyItem) return res.results[0]
    const user = res.results[0].item
    await this._setUserOrg(user, res.results[0].entry, res.results[0].attrs)
    return user
  }

  async getUser(filter) {
    return this._getUser(filter)
  }

  async getUserByEmail(email) {
    return this._getUser({ email })
  }

  async checkPassword(id, password) {
    const user = await this._getUser({ id }, false)
    if (!user) return
    const dn = user.entry.objectName

    const client = ldap.createClient({ url: this.ldapParams.url, reconnect: false, timeout: 4000 })
    client.bind = promisify(client.bind)
    client.unbind = promisify(client.unbind)
    try {
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
  async findUsers(params = {}) {
    const attributes = Object.values(this.ldapParams.users.mapping)
    if (this.ldapParams.members.role.attr) attributes.push(this.ldapParams.members.role.attr)
    const res = await this._search(
      this.ldapParams.baseDN,
      this._userMapping.filter({ q: params.q }, this.ldapParams.users.objectClass),
      attributes,
      this._userMapping.from,
      params,
      false
    )
    for (let i = 0; i < res.results.length; i++) {
      const user = res.results[i].item
      await this._setUserOrg(user, res.results[i].entry, res.results[i].attrs)
      res.results[i] = user
    }
    return res
  }

  async findMembers(organizationId, params = {}) {
    let dn
    if (this.ldapParams.organizations.staticSingleOrg) {
      dn = this.ldapParams.baseDN
    } else if (this.ldapParams.members.organizationAsDC) {
      dn = this._orgDN({ id: organizationId })
    } else {
      // TODO
    }

    if (dn) {
      const attributes = Object.values(this.ldapParams.users.mapping)
      let roleFilter
      if (this.ldapParams.members.role.attr) {
        attributes.push(this.ldapParams.members.role.attr)
        if (params.roles && params.roles.length) {
          let roleAttrValues = []
          params.roles.forEach(role => {
            roleAttrValues = roleAttrValues.concat(this.ldapParams.members.role.values[role] || (role === this.ldapParams.members.role.default ? [] : [role]))
          })
          if (roleAttrValues.length) {
            const roleAttrFilters = roleAttrValues.map(val => `(${this.ldapParams.members.role.attr}=${assertSafe(val)})`)
            if (roleAttrFilters.length > 1) {
              roleFilter = `(|${roleAttrFilters.join('')})`
            } else {
              roleFilter = roleAttrFilters[0]
            }
          }
        }
      }
      const res = await this._search(
        dn,
        this._userMapping.filter({ q: params.q }, this.ldapParams.users.objectClass, roleFilter),
        attributes,
        this._userMapping.from,
        params,
        false
      )
      for (let i = 0; i < res.results.length; i++) {
        const user = res.results[i].item
        await this._setUserOrg(user, res.results[i].entry, res.results[i].attrs)
        const userOrga = user.organizations.find(o => o.id === organizationId)
        res.results[i] = { id: user.id, name: user.name, email: user.email, role: userOrga.role, department: userOrga.department }
      }
      return res
    }
  }

  async createOrganization(org) {
    const entry = this._orgMapping.to(org)
    const dn = this._orgDN(org)

    // dc is in the dn string, not as an attribute
    delete entry.dc

    debug('add org to ldap', dn, entry)
    await this.client.add(dn, entry)
    return org
  }

  async deleteOrganization(id) {
    const dn = this._orgDN({ id })
    debug('delete org from ldap', dn)
    await this.client.del(dn)
  }

  async getOrganization(id) {
    if (this.ldapParams.organizations.staticSingleOrg) {
      if (this.ldapParams.organizations.staticSingleOrg.id === id) {
        return this.ldapParams.organizations.staticSingleOrg
      } else {
        return null
      }
    }
    const res = await this._search(
      this.ldapParams.baseDN,
      this._orgMapping.filter({ id }, this.ldapParams.organizations.objectClass),
      Object.values(this.ldapParams.organizations.mapping),
      this._orgMapping.from
    )
    return res.results[0]
  }

  async findOrganizations(params = {}) {
    if (this.ldapParams.organizations.staticSingleOrg) {
      return {
        count: 1,
        results: [this.ldapParams.organizations.staticSingleOrg]
      }
    }
    return this._search(
      this.ldapParams.baseDN,
      this._orgMapping.filter({ q: params.q }, this.ldapParams.organizations.objectClass),
      Object.values(this.ldapParams.organizations.mapping),
      this._orgMapping.from,
      params
    )
  }
}

exports.init = async (params) => new LdapStorage().init(params)
exports.readonly = require('config').storage.ldap.readonly
