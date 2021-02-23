const { promisify } = require('util')
const ldap = require('ldapjs')
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
    filter (obj, objectClass) {
      const parts = [`(objectClass=${objectClass})`]
        .concat(Object.keys(obj)
          .filter(key => !!obj[key])
          .map(key => `(${mapping[key]}=${assertSafe(obj[key])})`)
        )
      if (parts.length === 1) return parts[0]
      const filter = `(&${parts.join('')})`
      debug('ldap filter', obj, objectClass, filter)
      return filter
    }
  }
}

async function boundClient(params) {
  const client = ldap.createClient({ url: params.url, reconnect: true, timeut: 4000 })
  client.bind = promisify(client.bind)
  client.add = promisify(client.add)
  client.del = promisify(client.del)
  await client.bind(params.searchUserDN, params.searchUserPassword)
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
      this.ldapParams.organizationAsDC ? 'dcObject' : null
    )
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
    if (this.ldapParams.organizationAsDC) {
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

  async _getUser(filter, onlyItem = true) {
    const res = await this._search(
      this.ldapParams.baseDN,
      this._userMapping.filter(filter, this.ldapParams.users.objectClass),
      Object.values(this.ldapParams.users.mapping),
      this._userMapping.from,
      {},
      onlyItem
    )
    return res.results[0]
  }

  async getUser(filter) {
    return this._getUser(filter)
  }

  async getUserByEmail(email) {
    return this._getUser({ email })
  }

  async getPassword(userId) {
    // TODO
  }

  // ids, q, sort, select, skip, size
  async findUsers(params = {}) {
    return this._search(
      this.ldapParams.baseDN,
      `(objectClass=${this.ldapParams.users.objectClass})`,
      Object.values(this.ldapParams.users.mapping),
      this._userMapping.from,
      params
    )
  }

  async findMembers(organizationId, params = {}) {
    if (this.ldapParams.organizationAsDC) {
      const dn = this._orgDN(this._orgMapping.to({ id: organizationId }))
      return this._search(
        dn,
        `(objectClass=${this.ldapParams.users.objectClass})`,
        Object.values(this.ldapParams.users.mapping),
        this._userMapping.from,
        params
      )
    } else {
      // TODO
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
    const res = await this._search(
      this.ldapParams.baseDN,
      this._orgMapping.filter({ id }, this.ldapParams.organizations.objectClass),
      Object.values(this.ldapParams.organizations.mapping),
      this._orgMapping.from
    )
    return res.results[0]
  }

  async findOrganizations(params = {}) {
    return this._search(
      this.ldapParams.baseDN,
      `(objectClass=${this.ldapParams.organizations.objectClass})`,
      Object.values(this.ldapParams.organizations.mapping),
      this._orgMapping.from,
      params
    )
  }
}

exports.init = async (params) => new LdapStorage().init(params)
exports.readonly = require('config').storage.ldap.readonly
