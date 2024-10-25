import type { FindMembersParams, FindOrganizationsParams, FindUsersParams, SdStorage } from './interface.ts'
import config from '#config'
import type { LdapParams } from '#types'
import type { Organization, Partner, User, UserWritable } from '#types'
import mongo from '#mongo'
import memoize from 'memoizee'
import { promisify } from 'util'
import ldap from 'ldapjs'
import Debug from 'debug'
import { decipher } from '../utils/cipher.ts'
import type { OrganizationPost } from '#doc/organizations/post-req/index.ts'
import type { UserRef } from '@data-fair/lib-express'
import type { TwoFA } from '#services'
import userName from '../utils/user-name.ts'

const debug = Debug('ldap')

function sortCompare (sort: Record<string, 1 | -1>, propKey?: string) {
  return function (a: Record<string, any>, b: Record<string, any>) {
    if (propKey) {
      a = a[propKey]
      b = b[propKey]
    }
    for (const key of Object.keys(sort || {})) {
      if (a[key] > b[key]) return sort[key]
      if (a[key] < b[key]) return sort[key] * -1
    }
    return 0
  }
}

type MappingFn = (from: Record<string, any>) => Record<string, any>

function buildMappingFn (
  mapping: Record<string, string>,
  required: string[],
  multiValued: string[],
  objectClass: string,
  secondaryObjectClass: string | undefined,
  prefixes: Record<string, string>
) {
  return {
    from (attrs: Record<string, any>) {
      const result: Record<string, any> = {}
      Object.keys(mapping).forEach(key => {
        if (attrs[mapping[key]] && attrs[mapping[key]][0]) {
          const values = attrs[mapping[key]].map((v: any) => {
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
    to (obj: Record<string, any>) {
      const entry: Record<string, any> = { objectClass: secondaryObjectClass ? [objectClass, secondaryObjectClass] : objectClass }
      Object.keys(mapping).forEach(key => {
        if (obj[key] && (!multiValued.includes(key) || obj[key].length) && !entry[mapping[key]]) {
          entry[mapping[key]] = obj[key] && obj[key].replace(prefixes[key] || '', '')
        } else if (required.includes(key)) {
          throw new Error(`${key} attribute is required`)
        }
      })
      return entry
    },
    filter (obj: Record<string, any>, objectClass: string, extraFilters: any[] = []) {
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

export class LdapStorage implements SdStorage {
  readonly?: boolean | undefined

  private ldapParams: LdapParams
  private org: Organization | undefined
  private userMapping: ReturnType<typeof buildMappingFn>
  private _orgMapping: ReturnType<typeof buildMappingFn> | undefined

  private get orgMapping () {
    if (!this._orgMapping) throw new Error('ldap not configured to run in multi-organizations mode')
    return this._orgMapping
  }

  constructor (params: LdapParams, org?: Organization) {
    this.ldapParams = params
    this.org = org
    console.log('Connecting to ldap ' + params.url)
    // check connexion at startup

    const prefixes: Record<string, string> = org ? { id: `ldap_${org.id}_` } : {}
    this.userMapping = buildMappingFn(
      this.ldapParams.users.mapping,
      ['email'],
      [],
      this.ldapParams.users.objectClass,
      undefined,
      prefixes
    )
    if (!this.org) {
      this._orgMapping = buildMappingFn(
        this.ldapParams.organizations.mapping,
        ['id'],
        [],
        this.ldapParams.organizations.objectClass,
        this.ldapParams.members.organizationAsDC ? 'dcObject' : undefined,
        {}
      )
    }
  }

  async init () {
    await this.withClient(async () => {})
    return this
  }

  private async withClient <T>(fn: (client: ldap.Client) => Promise<T>) {
    const client = ldap.createClient({ url: this.ldapParams.url, timeout: 4000 })
    client.on('error', err => console.error(err.message))

    const bind = promisify(client.bind).bind(client)
    const unbind = promisify(client.unbind).bind(client)

    if (this.ldapParams.searchUserDN && this.ldapParams.searchUserPassword) {
      debug('bind service account', this.ldapParams.url, this.ldapParams.searchUserDN)
      await bind(this.ldapParams.searchUserDN, decipher(this.ldapParams.searchUserPassword as any))
    } else {
      console.warn('No ldap search user credentials configured, proceed without binding a service account')
    }
    try {
      return await fn(client)
    } finally {
      await unbind()
    }
  }

  _getAllUsers = memoize(async (client) => {
    const attributes = Object.values(this.ldapParams.users.mapping)
    const extraFilters: any[] = [...(this.ldapParams.users.extraFilters || [])]
    if (this.ldapParams.members.role.attr) {
      attributes.push(this.ldapParams.members.role.attr)
    }
    if (this.ldapParams.members.onlyWithRole) {
      extraFilters.push(this._getRoleFilter(Object.keys(this.ldapParams.members.role.values ?? {})))
    }
    const res = await this._search<User>(
      client,
      this.ldapParams.baseDN,
      this.userMapping.filter({}, this.ldapParams.users.objectClass, extraFilters),
      attributes,
      this.userMapping.from
    )
    return res
  }, { maxAge: config.storage.ldap.cacheMS }) // 5 minutes cache

  // promisified search
  async _search <T>(client: ldap.Client, base: string, filter: any, attributes: string[], mappingFn: MappingFn) {
    const results = await new Promise<any[]>((resolve, reject) => {
      client.search(base, {
        filter,
        attributes: attributes.filter(key => !!key),
        scope: 'sub',
        paged: true
      }, (err, res) => {
        if (err) return reject(err)
        const results: any[] = []
        res.on('searchEntry', (entry) => {
          const attrs: Record<string, any> = {}
          entry.attributes.forEach(attr => {
            const values = typeof attr.values === 'string' ? [attr.values] : attr.values
            attrs[attr.type] = values.map(v => v.toString())
          })
          try {
            results.push({ entry, attrs, item: mappingFn(attrs) })
          } catch (err: any) {
            debug(err.message, entry)
          }
        })
        res.on('error', (err: any) => {
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
      fullResults: results as { entry: ldap.SearchEntry, attrs: Record<string, any>, item: T }[],
      results: results
        .map(result => result.item) as T[]
    }
  }

  private userDN (user: Pick<User, 'id' | 'email' | 'organizations'>) {
    const entry = this.userMapping.to(user)
    const dnKey = this.ldapParams.users.dnKey
    if (!entry[dnKey]) throw new Error(`La clé ${dnKey} est obligatoire`)
    if (this.ldapParams.organizations.staticSingleOrg || this.org) {
      return `${dnKey}=${entry[dnKey]}, ${this.ldapParams.baseDN}`
    } else if (this.ldapParams.members.organizationAsDC) {
      if (!user.organizations || !user.organizations.length) {
        throw new Error('L\'utilisateur doit être associé à une organisation dès la création')
      }
      const orgEntry = this.orgMapping.to(user.organizations[0])
      const orgDNKey = this.ldapParams.organizations.dnKey
      if (!orgEntry[orgDNKey]) throw new Error(`La clé ${orgDNKey} est obligatoire dans l'organisation`)
      return `${dnKey}=${entry[dnKey]}, ${orgDNKey}=${orgEntry[orgDNKey]}, ${this.ldapParams.baseDN}`
    } else {
      return `${dnKey}=${entry[dnKey]}, ${this.ldapParams.baseDN}`
    }
  }

  private orgDN (org: { id: string }) {
    const entry = this.orgMapping.to(org)
    const dnKey = this.ldapParams.organizations.dnKey
    if (!entry[dnKey]) throw new Error(`La clé ${dnKey} est obligatoire`)
    return `${dnKey}=${entry[dnKey]},${this.ldapParams.baseDN}`
  }

  async _setUserOrg (client: ldap.Client, user: User, entry: ldap.SearchEntry, attrs: Record<string, any>, orgCache: Record<string, Organization> = {}) {
    let org: { id: string, name: string, department?: string } | undefined
    if (this.ldapParams.organizations.staticSingleOrg) {
      org = this.ldapParams.organizations.staticSingleOrg
    } else if (this.org) {
      org = { id: this.org.id, name: this.org.name }
    } else if (this.ldapParams.members.organizationAsDC) {
      const dn = ldap.parseDN(entry.dn.toString())
      dn.shift()
      const orgDC = dn.shift().toString().replace('dc=', '')
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
          role = Object.keys(this.ldapParams.members.role.values ?? {})
            .find(role => !!ldapRoles.find((ldapRole: string) => this.ldapParams.members.role.values?.[role].includes(ldapRole)))
        }
      }
      let overwrite
      if ((this.ldapParams.overwrite || []).includes('members')) {
        overwrite = await mongo.ldapMembersOverwrite.findOne({ orgId: org.id, userId: user.id })
      }
      overwrite = overwrite || (this.ldapParams.members.overwrite || [])
        .find(o => (o.orgId === org.id || !o.orgId) && o.email?.toLowerCase() === user.email?.toLowerCase())

      role = (overwrite && overwrite.role) || role || this.ldapParams.members.role.default
      const department = overwrite ? overwrite.department : org.department
      user.organizations = [{ ...org, role, department }]
    }
  }

  async _getUser (filter: any, onlyItem = true) {
    debug('search single user', filter)
    const attributes = Object.values(this.ldapParams.users.mapping)
    if (this.ldapParams.members.role.attr) attributes.push(this.ldapParams.members.role.attr)
    return this.withClient<{ user: User, entry: ldap.SearchEntry } | undefined>(async (client) => {
      const res = await this._search<User>(
        client,
        this.ldapParams.baseDN,
        this.userMapping.filter(filter, this.ldapParams.users.objectClass, this.ldapParams.users.extraFilters),
        attributes,
        this.userMapping.from
      )
      if (!res.results[0]) return
      const user = { ...res.results[0] }
      await this._setUserOrg(client, user, res.fullResults[0].entry, res.fullResults[0].attrs)
      const overwrite = (this.ldapParams.users.overwrite || []).find(o => o.email?.toLowerCase() === user.email?.toLowerCase())
      if (overwrite) Object.assign(user, overwrite)
      if (this.org) user.orgStorage = true
      return { ...res.fullResults[0], user }
    })
  }

  async getUser (id: string) {
    return (await this._getUser({ id }))?.user
  }

  async getUserByEmail (email: string) {
    return (await this._getUser({ email }))?.user
  }

  async checkPassword (id: string, password: string) {
    const user = await this._getUser({ id }, false)
    if (!user) return false
    const dn = user.entry.dn.toString()
    if (!dn) return false

    const client = ldap.createClient({ url: this.ldapParams.url, reconnect: false, timeout: 4000 })
    const bind = promisify(client.bind).bind(client)
    try {
      debug('try to bind user', dn)
      await bind(dn, password)
      return true
    } catch (err) {
      debug('auth failure', id, err)
      return false
    } finally {
      client.unbind()
    }
  }

  // ids, q, sort, select, skip, size
  async findUsers (params: FindUsersParams) {
    debug('find users', params)
    return this.withClient(async (client) => {
      let fullresults = (await this._getAllUsers(client)).fullResults
      let results: User[] = []

      const orgCache = {}
      for (let i = 0; i < fullresults.length; i++) {
        const user = fullresults[i].item
        await this._setUserOrg(client, user, fullresults[i].entry, fullresults[i].attrs, orgCache)
        const overwrite = (this.ldapParams.users.overwrite || []).find(o => o.email === user.email)
        if (overwrite) Object.assign(user, overwrite)
        // email is implicitly confirmed in ldap mode
        user.emailConfirmed = true
        results.push(user)
      }
      const ids = params.ids
      if (ids) {
        results = results.filter(user => ids.find(id => user.id === id))
      }
      if (params.q) {
        const lq = params.q.toLowerCase()
        results = results.filter(user => user.name.toLowerCase().indexOf(lq) >= 0)
        fullresults = fullresults.filter(result => result.item.name.toLowerCase().indexOf(lq) >= 0)
      }
      fullresults.sort(sortCompare(params.sort, 'item'))
      results.sort(sortCompare(params.sort))
      const count = fullresults.length
      const skip = params.skip || 0
      const size = params.size || 20
      results = results.slice(skip, skip + size)
      return { count, results }
    })
  }

  private _getRoleFilter (roles: string[]) {
    let roleAttrValues: string[] = []
    roles.forEach(role => {
      roleAttrValues = roleAttrValues.concat(this.ldapParams.members.role.values?.[role] || (role === this.ldapParams.members.role.default ? [] : [role]))
    })
    if (roleAttrValues.length) {
      const roleAttrFilters = roleAttrValues.map(value => new ldap.EqualityFilter({ attribute: this.ldapParams.members.role.attr as string, value }))
      if (roleAttrFilters.length > 1) {
        // roleFilter = `(|${roleAttrFilters.join('')})`
        return new ldap.OrFilter({ filters: roleAttrFilters })
      } else {
        return roleAttrFilters[0]
      }
    }
  }

  async findMembers (organizationId: string, params: FindMembersParams) {
    debug('find members', params)
    const users = (await this.findUsers({ ...params, sort: null, skip: 0, size: 10000 })).results
    let members = users
      .filter(user => user.organizations.find(o => o.id === organizationId))
      .map(user => {
        const userOrga = user.organizations.find(o => o.id === organizationId)
        if (!userOrga) throw new Error('impossible error')
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: userOrga.role,
          department: userOrga.department,
          emailConfirmed: true
        }
      })
    const roles = params.roles
    if (roles?.length) {
      members = members.filter(member => roles.includes(member.role))
    }
    const deps = params.departments
    if (deps?.length) {
      members = members.filter(member => member.department && deps.includes(member.department))
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

  async addMember (orga: Organization, user: User, role: string, department: string) {
    if (!(this.ldapParams.overwrite || []).includes('members')) throw new Error('ldap members overwrite not supported')
    await mongo.ldapMembersOverwrite.replaceOne(
      { orgId: orga.id, userId: user.id },
      { orgId: orga.id, department, userId: user.id, role },
      { upsert: true }
    )
  }

  async patchMember (orgId: string, userId: string, department = null, patch: any) {
    if (!(this.ldapParams.overwrite || []).includes('members')) throw new Error('ldap members overwrite not supported')
    await mongo.ldapMembersOverwrite.replaceOne(
      { orgId, userId },
      { ...patch, orgId, userId },
      { upsert: true }
    )
  }

  async removeMember (orgId: string, userId: string) {
    if (!(this.ldapParams.overwrite || []).includes('members')) throw new Error('ldap members overwrite not supported')
    await mongo.ldapMembersOverwrite
      .deleteOne({ orgId, userId })
  }

  async _getOrganization (client: ldap.Client, id: string) {
    let org: Organization | undefined
    if (this.ldapParams.organizations.staticSingleOrg) {
      if (this.ldapParams.organizations.staticSingleOrg.id === id) {
        org = this.ldapParams.organizations.staticSingleOrg
      }
    } else {
      const res = await this._search<Organization>(
        client,
        this.ldapParams.baseDN,
        this.orgMapping.filter({ id }, this.ldapParams.organizations.objectClass, this.ldapParams.organizations.extraFilters),
        Object.values(this.ldapParams.organizations.mapping),
        this.orgMapping.from
      )
      org = res.results[0]
    }
    if (org) {
      let overwrite
      if ((this.ldapParams.overwrite || []).includes('organizations') || (this.ldapParams.overwrite || []).includes('departments')) {
        overwrite = await mongo.ldapOrganizationsOverwrite.findOne({ id: org.id })
      }
      overwrite = overwrite || (this.ldapParams.organizations.overwrite || []).find(o => (o.id === org.id))
      if (overwrite) Object.assign(org, overwrite)
      org.departments = org.departments || []
    }
    return org as Organization
  }

  async getOrganization (id: string) {
    return this.withClient(async (client) => {
      return this._getOrganization(client, id)
    })
  }

  async findOrganizations (params: FindOrganizationsParams) {
    debug('find orgs', params)
    if (this.ldapParams.organizations.staticSingleOrg) {
      return {
        count: 1,
        results: [this.ldapParams.organizations.staticSingleOrg]
      }
    }
    const extraFilters = [...(this.ldapParams.organizations.extraFilters || [])]
    return this.withClient(async (client) => {
      const res = await this._search<Organization>(
        client,
        this.ldapParams.baseDN,
        this.orgMapping.filter({ q: params.q }, this.ldapParams.organizations.objectClass, extraFilters),
        Object.values(this.ldapParams.organizations.mapping),
        this.orgMapping.from
      )
      res.results.sort(sortCompare(params.sort))
      return { count: res.count, results: res.results }
    })
  }

  async patchOrganization (id: string, patch: any, user: UserRef) {
    if (!((this.ldapParams.overwrite || []).includes('organizations') || (this.ldapParams.overwrite || []).includes('departments'))) {
      throw new Error('ldap organizations overwrite not supported')
    }
    patch.updated = { id: user.id, name: user.name, date: new Date() }
    patch.id = id
    await mongo.ldapOrganizationsOverwrite.findOneAndUpdate(
      { id },
      { $set: patch },
      { upsert: true }
    )
    return await this.getOrganization(id)
  }

  async required2FA (user: User) {
    if (user.isAdmin && config.admins2FA) return true
    return false
  }

  async get2FA (userId: string) {
    return undefined
  }

  // WARNING: the following is used only in tests as ldap storage is always readonly
  // except for the overwritten properties stored in mongo

  async _createUser (user: Omit<UserWritable, 'password'> & { password?: string }) {
    const entry = this.userMapping.to({ ...user, lastName: user.lastName || 'missing', name: userName(user) })
    if (user.password) entry.userPassword = user.password
    const dn = this.userDN(user)
    if (user.organizations.length && this.ldapParams.members.role.attr) {
      const roleValues = this.ldapParams.members.role.values?.[user.organizations[0].role]
      const roleValue = roleValues?.[0]
      entry[this.ldapParams.members.role.attr] = roleValue || this.ldapParams.members.role.default
    }

    debug('add user to ldap', dn, entry)
    await this.withClient(async (client) => {
      const add = promisify(client.add).bind(client)
      await add(dn, entry)
    })
    return user
  }

  async _deleteUser (id: string) {
    const user = await this._getUser({ id }, false)
    if (!user) {
      debug('delete user not found')
      return
    }
    const dn = user.entry.objectName as string
    debug('delete user from ldap', dn)
    await this.withClient(async (client) => {
      const del = promisify(client.del).bind(client)
      await del(dn)
    })
  }

  async _createOrganization (org: Organization) {
    const entry = this.orgMapping.to(org)
    const dn = this.orgDN(org)

    // dc is in the dn string, not as an attribute
    delete entry.dc

    debug('add org to ldap', dn, entry)
    await this.withClient(async (client) => {
      const add = promisify(client.add).bind(client)
      await add(dn, entry)
    })
    return org
  }

  async _deleteOrganization (id: string) {
    const dn = this.orgDN({ id })
    debug('delete org from ldap', dn)
    await this.withClient(async (client) => {
      const del = promisify(client.del).bind(client)
      await del(dn)
    })
  }

  createUser (user: UserWritable, byUser?: { id: string; name: string }, host?: string): Promise<User> {
    throw new Error('Method not implemented.')
  }

  updateLogged (userId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  confirmEmail (userId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  deleteUser (userId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  patchUser (userId: string, patch: any, byUser?: { id: string; name: string }): Promise<User> {
    throw new Error('Method not implemented.')
  }

  findInactiveUsers (): Promise<User[]> {
    throw new Error('Method not implemented.')
  }

  findUsersToDelete (): Promise<User[]> {
    throw new Error('Method not implemented.')
  }

  createOrganization (org: OrganizationPost, user: UserRef): Promise<Organization> {
    throw new Error('Method not implemented.')
  }

  deleteOrganization (orgId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  set2FA (userId: string, twoFA: TwoFA): Promise<void> {
    throw new Error('Method not implemented.')
  }

  addPartner (orgId: string, partner: Partner): Promise<void> {
    throw new Error('Method not implemented.')
  }

  deletePartner (orgId: string, partnerId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  validatePartner (orgId: string, partnerId: string, partner: Organization): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

export const init = async (params: LdapParams, org?: Organization) => new LdapStorage(params, org).init()
export const readonly = true
export const overwrite = config.storage.ldap.overwrite