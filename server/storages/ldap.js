const { promisify } = require('util')
const ldap = require('ldapjs')
const debug = require('debug')('ldap')

// TODO: should we sanititze user inputs to prevent injection ?

function sortCompare(sort) {
  return function(a, b) {
    for (let key of Object.keys(sort || {})) {
      if (a[key] < b[key]) return sort[key]
    }
    return 0
  }
}

function buildMappingFn(mapping, required, multiValued) {
  return (attrs) => {
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
  }
}

async function boundClient(params) {
  const client = ldap.createClient({ url: params.url, reconnect: true, timeut: 4000 })
  client.bind = promisify(client.bind)
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
    return this
  }

  // promisified search
  async _search (base, filter, params, mappingFn) {
    const results = await new Promise((resolve, reject) => {
      this.client.search(base, { filter, scope: 'sub', paged: true }, (err, res) => {
        if (err) return reject(err)
        const results = []
        res.on('searchEntry', (entry) => {
          const attrs = {}
          entry.attributes.forEach(attr => {
            attrs[attr.type] = attr._vals.map(v => v.toString())
          })
          try {
            results.push(mappingFn(attrs))
          } catch (err) {
            console.error(err)
          }
        })
        res.on('error', (err) => reject(err))
        res.on('end', () => resolve(results))
      })
    })

    return {
      count: results.length,
      results: results.sort(sortCompare(params.sort)).slice(params.skip, params.skip + params.size)
    }
  }

  async getUser(filter) {
    // TODO
  }

  async getUserByEmail(email) {
    // TODO
  }

  async getPassword(userId) {
    // TODO
  }

  // ids, q, sort, select, skip, size
  async findUsers(params = {}) {
    return this._search(
      this.ldapParams.baseDN,
      this.ldapParams.users.filter,
      params,
      buildMappingFn(this.ldapParams.users.mapping, ['id', 'email'], [])
    )
  }

  async findMembers(organizationId, params = {}) {
    // TODO
  }

  async getOrganization(id) {
    // TODO
    // return organization
  }

  async findOrganizations(params = {}) {
    // TODO
    // return { count, results }
  }
}

exports.init = async (params) => new LdapStorage().init(params)
exports.readonly = true
