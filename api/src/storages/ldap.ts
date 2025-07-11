import type { FindMembersParams, FindOrganizationsParams, FindUsersParams, SdStorage } from './interface.ts'
import config from '#config'
import type { LdapParams, Member, MemberOverwrite, ServerSession, Site } from '#types'
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
import slugify from 'slugify'
import { type PatchMemberBody } from '#doc/organizations/patch-member-req/index.ts'

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

const parseDN = (dn: string) => {
  const obj: Record<string, string[]> = {}
  const parts = dn.split(',')
  for (const part of parts) {
    const [k, value] = part.split('=')
    const key = k.toLowerCase()
    obj[key] = obj[key] ?? []
    obj[key].push(value)
  }
  return obj
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
  initializing: boolean = true
  private ldapParams: LdapParams
  private org: Organization | undefined
  private userMapping: ReturnType<typeof buildMappingFn>
  private _orgMapping: ReturnType<typeof buildMappingFn> | undefined

  private get orgMapping () {
    if (!this._orgMapping) throw new Error('ldap not configured to run in multi-organizations mode')
    return this._orgMapping
  }

  private get useDC () {
    return this.ldapParams.members.organizationAsDC === true || typeof this.ldapParams.members.organizationAsDC === 'number'
  }

  private roleCaptureRegex: RegExp | undefined
  private departmentCaptureRegex: RegExp | undefined
  private organizationCaptureRegex: RegExp | undefined

  constructor (params: LdapParams, org?: Organization) {
    this.ldapParams = params
    this.org = org
    console.log('Connecting to ldap ' + params.url)
    // check connexion at startup

    if (this.ldapParams.members.role.captureRegex) {
      this.roleCaptureRegex = new RegExp(this.ldapParams.members.role.captureRegex)
    }
    if (this.ldapParams.members.department?.captureRegex) {
      this.departmentCaptureRegex = new RegExp(this.ldapParams.members.department.captureRegex)
    }
    if (this.ldapParams.members.organization?.captureRegex) {
      this.organizationCaptureRegex = new RegExp(this.ldapParams.members.organization.captureRegex)
    }

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
        this.useDC ? 'dcObject' : undefined,
        {}
      )
    }

    if (this.ldapParams.prefillCache && !this.org) {
      debug('prefill users cache')
      this.getAllUsers().catch(err => {
        console.error('failed to prefill users cache', err)
      }).finally(() => {
        this.initializing = false
      })
      if (!this.ldapParams.organizations.staticSingleOrg) {
        debug('prefill orgs cache')
        this.getAllOrgs().catch(err => {
          console.error('failed to prefill orgs cache', err)
        })
      }
    } else {
      this.initializing = false
    }
  }

  async init () {
    await this.withClient(async () => {})
    return this
  }

  private async withClient <T>(fn: (client: ldap.Client) => Promise<T>) {
    const client = ldap.createClient({ url: this.ldapParams.url, timeout: 4000, ...this.ldapParams.clientOptions })
    client.on('error', err => console.error(err.message))

    const bind = promisify(client.bind).bind(client)

    if (this.ldapParams.searchUserDN && this.ldapParams.searchUserPassword) {
      debug('bind service account', this.ldapParams.url, this.ldapParams.searchUserDN)
      await bind(this.ldapParams.searchUserDN, decipher(this.ldapParams.searchUserPassword as any))
    } else {
      console.warn('No ldap search user credentials configured, proceed without binding a service account')
    }
    try {
      return await fn(client)
    } finally {
      client.destroy()
    }
  }

  private getUserSearchParams () {
    const attributes = Object.values(this.ldapParams.users.mapping)
    if (this.ldapParams.members.role.attr) attributes.push(this.ldapParams.members.role.attr)
    if (this.ldapParams.members.department?.attr) attributes.push(this.ldapParams.members.department.attr)
    if (this.ldapParams.members.organization?.attr) attributes.push(this.ldapParams.members.organization.attr)
    if (this.ldapParams.isAdmin?.attr) attributes.push(this.ldapParams.isAdmin.attr)
    for (const o of this.ldapParams.members?.overwrite || []) {
      for (const attr in (o.attrs || {})) attributes.push(attr)
    }
    const extraFilters: any[] = [...(this.ldapParams.users.extraFilters || [])]
    return { attributes, extraFilters }
  }

  private allUsersCache: { dataPromise?: Promise<User[]>, lastFetch?: Date, previousData?: User[], previousFetch?: Date } = {}

  private async _getAllUsers () {
    debug('fetch whole users list')
    const { attributes, extraFilters } = this.getUserSearchParams()
    return this.withClient(async (client) => {
      const res = await this._search<User>(
        client,
        this.ldapParams.baseDN,
        this.userMapping.filter({}, this.ldapParams.users.objectClass, extraFilters),
        attributes,
        this.userMapping.from
      )
      debug(`found ${res.count} users`)
      const results: User[] = []
      const orgCache = {}
      for (let i = 0; i < res.fullResults.length; i++) {
        const user = res.fullResults[i].item
        await this._setUserOrg(client, user, res.fullResults[i].entry, res.fullResults[i].attrs, orgCache)
        if (this.ldapParams.members.onlyWithRole) {
          if (!user.organizations?.length) continue
        }
        const overwrite = (this.ldapParams.users.overwrite || []).find(o => o.email === user.email)
        if (overwrite) Object.assign(user, overwrite)
        // email is implicitly confirmed in ldap mode
        user.emailConfirmed = true
        user.name = user.name || userName(user)
        results.push(user)
      }
      return results
    })
  }

  private async getAllUsers (): Promise<{ results: User[], fetchDate: string, fromCache?: string }> {
    let fromCache: string | undefined
    let fetchDate: string
    if (!this.allUsersCache.dataPromise || !this.allUsersCache.lastFetch || (Date.now() - this.allUsersCache.lastFetch.getTime()) > config.storage.ldap.cacheMS) {
      const usersPromise = this._getAllUsers()
      this.allUsersCache.dataPromise = usersPromise
      const date = new Date()
      this.allUsersCache.lastFetch = date
      fetchDate = date.toISOString()
      usersPromise.then((users) => {
        this.allUsersCache.previousData = users
        this.allUsersCache.previousFetch = date
      }, err => {
        console.error('failed to fetch all users', err)
      })
    } else {
      fromCache = this.allUsersCache.lastFetch.toISOString()
      fetchDate = fromCache
    }
    const previousData = this.allUsersCache.previousData
    const previousFetch = this.allUsersCache.previousFetch?.toISOString()
    if (previousData && previousFetch) {
      const results = await Promise.race<User[]>([
        this.allUsersCache.dataPromise,
        new Promise<User[]>(resolve => setTimeout(() => {
          fromCache = previousFetch
          resolve(previousData)
        }, 5000))
      ])
      return { results, fromCache, fetchDate }
    } else {
      return { results: await this.allUsersCache.dataPromise, fromCache, fetchDate }
    }
  }

  private allOrgsCache: { dataPromise?: Promise<Organization[]>, lastFetch?: Date } = {}

  private async _getAllOrgs () {
    debug('fetch whole organizations list')
    return this.withClient(async (client) => {
      const res = await this._search<Organization>(
        client,
        this.ldapParams.baseDN,
        this.orgMapping.filter({}, this.ldapParams.organizations.objectClass, this.ldapParams.organizations.extraFilters),
        Object.values(this.ldapParams.organizations.mapping),
        this.orgMapping.from
      )
      const results = res.results
      for (const org of results) {
        org.id = slugify.default(org.id, { lower: true, strict: true })
        let overwrite
        if ((this.ldapParams.overwrite || []).includes('organizations')) {
          overwrite = await mongo.ldapOrganizationsOverwrite.findOne({ id: org.id })
        }
        overwrite = overwrite || (this.ldapParams.organizations.overwrite || []).find(o => (o.id === org.id))
        if (overwrite) Object.assign(org, overwrite)
      }
      if (!this.org && config.adminsOrg) {
        results.push({ ...config.adminsOrg, departments: [] })
      }
      return results
    })
  }

  private async getAllOrgs (): Promise<{ results: Organization[], fromCache?: string }> {
    let fromCache: string | undefined
    if (!this.allOrgsCache.dataPromise || !this.allOrgsCache.lastFetch || (Date.now() - this.allOrgsCache.lastFetch.getTime()) > config.storage.ldap.cacheMS) {
      const orgsPromise = this._getAllOrgs()
      this.allOrgsCache.dataPromise = orgsPromise
      this.allOrgsCache.lastFetch = new Date()
      orgsPromise.catch(err => {
        console.error('failed to fetch all orgs', err)
      })
    } else {
      fromCache = this.allOrgsCache.lastFetch.toISOString()
    }
    return { results: await this.allOrgsCache.dataPromise, fromCache }
  }

  // promisified search
  async _search <T>(client: ldap.Client, base: string, filter: any, attributes: string[], mappingFn: MappingFn) {
    debug(`perform search
      - base: ${base}
      - filter: ${filter}
      - attributes: ${JSON.stringify(attributes)}`)
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
    } else if (this.useDC) {
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

  async _setUserOrg (client: ldap.Client, user: User, entry: ldap.SearchEntry, attrs: Record<string, string[]>, orgCache: Record<string, Organization> = {}) {
    let org: { id: string, name: string, department?: string } | undefined
    if (this.ldapParams.organizations.staticSingleOrg) {
      org = this.ldapParams.organizations.staticSingleOrg
    } else if (this.org) {
      org = { id: this.org.id, name: this.org.name }
    } else if (this.ldapParams.members.organization?.attr) {
      let ldapOrg = attrs[this.ldapParams.members.organization.attr]?.[0]
      if (!ldapOrg) {
        throw new Error(`failed to map the user to an organization using attribute: ${this.ldapParams.members.organization.attr}=${ldapOrg}`)
      }
      if (this.organizationCaptureRegex) {
        const match = ldapOrg.match(this.organizationCaptureRegex)
        debug('applied organization capture regexp', ldapOrg, match)
        if (match) ldapOrg = match[1]
      }

      orgCache[ldapOrg] = orgCache[ldapOrg] || await this._getOrganization(client, ldapOrg)
      org = orgCache[ldapOrg]
    } else if (this.useDC) {
      const ind = typeof this.ldapParams.members.organizationAsDC === 'number' ? this.ldapParams.members.organizationAsDC : 0
      const dn = entry.dn.toString()
      const parsedDN = parseDN(dn)
      const orgDC = parsedDN.dc?.[ind]
      debug(`extract org id based on DC in user DN: dn=${dn}, parsedDN=${JSON.stringify(parsedDN)}, orgDC=${orgDC}`)
      if (!orgDC) {
        throw new Error(`failed to map the user to an organization using dn/dc: dn=${dn}, dc=${orgDC}, parsedDN=${JSON.stringify(parsedDN)}`)
      }
      orgCache[orgDC] = orgCache[orgDC] || await this._getOrganization(client, orgDC)
      org = orgCache[orgDC]
    }

    user.organizations = []
    if (org) {
      let roles: string[] = []
      if (this.ldapParams.members.role.attr) {
        const ldapRoles = attrs[this.ldapParams.members.role.attr]
        debug(`try to map role for user ${user.id}`, ldapRoles)
        if (ldapRoles) {
          for (let ldapRole of ldapRoles) {
            if (this.roleCaptureRegex) {
              const match = ldapRole.match(this.roleCaptureRegex)
              debug('applied role capture regexp', ldapRole, match)
              if (match) ldapRole = match[1]
            }
            for (const role of Object.keys(this.ldapParams.members.role.values ?? {})) {
              if (this.ldapParams.members.role.values?.[role].includes(ldapRole)) {
                roles.push(role)
              }
            }
          }
        }
      }
      let department
      if (this.ldapParams.members.department?.attr) {
        const ldapDepartment = attrs[this.ldapParams.members.department.attr]
        debug(`try to map department for user ${user.id}`, ldapDepartment)
        if (ldapDepartment?.length) {
          if (this.departmentCaptureRegex) {
            const match = ldapDepartment[0].match(this.departmentCaptureRegex)
            debug('applied department capture regexp', ldapDepartment[0], match)
            if (match) {
              department = match[1]
            }
          } else {
            department = ldapDepartment[0]
          }
        }
      }

      if (!roles.length && !this.ldapParams.members.onlyWithRole) {
        roles = [this.ldapParams.members.role.default]
      }
      department = department || org.department
      if (roles.length) {
        if (config.multiRoles) {
          user.organizations = [...new Set(roles)].map(role => ({ id: org.id, name: org.name, role, department }))
        } else {
          user.organizations = [{ id: org.id, name: org.name, role: roles[0], department }]
        }
      }
    }

    let overwrites: MemberOverwrite[] = []
    if ((this.ldapParams.overwrite || []).includes('members')) {
      overwrites = await mongo.ldapMembersOverwrite.find({ userId: user.id }).toArray()
      debug('found overwritten member info in local db', overwrites)
    }
    overwrites = overwrites.concat((this.ldapParams.members.overwrite || []))
    for (const overwrite of overwrites) {
      if (overwrite.email) {
        if (overwrite.email?.toLowerCase() !== user.email?.toLowerCase()) continue
      } else if (overwrite.matchAttrs && overwrite.matchAttrs.length) {
        let match = true
        for (const matchAttr of overwrite.matchAttrs) {
          let attrValues: string[] = []
          if (attrs[matchAttr.attr]) {
            if (matchAttr.captureRegex) {
              const captureRegex = new RegExp(matchAttr.captureRegex)
              for (const v of attrs[matchAttr.attr]) {
                const m = v.match(captureRegex)
                if (m && m[1]) attrValues.push(m[1])
              }
            } else {
              attrValues = attrs[matchAttr.attr]
            }
          }
          if (!matchAttr.values.some(v => attrValues.includes(v))) match = false
        }
        if (!match) continue
      } else {
        continue
      }
      const overwriteRole = overwrite.role || (this.ldapParams.members.role.default)
      if (!overwrite.orgId) {
        for (const o of user.organizations) {
          if (overwrite.role) {
            debug('apply overwrite role', o, overwrite.role)
            o.role = overwrite.role
          }
          if (overwrite.department) {
            debug('apply overwrite department', o, overwrite.department)
            o.department = overwrite.department
          }
        }
      } else {
        const userOrg = user.organizations.find(o => o.id === overwrite.orgId)
        if (userOrg) {
          if (overwrite.role) {
            debug('apply overwrite role', userOrg, overwrite.role)
            userOrg.role = overwrite.role
          }
          if (overwrite.department) {
            debug('apply overwrite department', userOrg, overwrite.department)
            userOrg.department = overwrite.department
          }
        } else {
          const fullO = orgCache[overwrite.orgId] = orgCache[overwrite.orgId] || await this._getOrganization(client, overwrite.orgId)
          if (fullO) {
            const newUserOrg = { id: fullO.id, name: fullO.name, role: overwriteRole, department: overwrite.department }
            if (overwrite.orgOnly) {
              debug('define user organization from overwrite', newUserOrg)
              user.organizations = [newUserOrg]
            } else {
              debug('push user organization from overwrite', newUserOrg)
              user.organizations.push(newUserOrg)
            }
          } else {
            debug('unknown organization referenced in members overwrite', overwrite.orgId)
          }
        }
      }
    }
  }

  async _getUser (filter: any, withSession = true) {
    debug('search single user', filter)
    const { attributes, extraFilters } = this.getUserSearchParams()
    return this.withClient<{ user: User, entry: ldap.SearchEntry } | undefined>(async (client) => {
      const res = await this._search<User>(
        client,
        this.ldapParams.baseDN,
        this.userMapping.filter(filter, this.ldapParams.users.objectClass, extraFilters),
        attributes,
        this.userMapping.from
      )
      if (!res.results[0]) return
      const user = { ...res.results[0] }
      await this._setUserOrg(client, user, res.fullResults[0].entry, res.fullResults[0].attrs)
      const overwrite = (this.ldapParams.users.overwrite || []).find(o => o.email?.toLowerCase() === user.email?.toLowerCase())
      if (overwrite) Object.assign(user, overwrite)
      if (this.org) user.orgStorage = true
      if (withSession) user.sessions = (await mongo.ldapUserSessions.findOne({ _id: user.id }))?.sessions
      if (!this.org) {
        user.isAdmin = config.admins.includes(user.email.toLowerCase())
        if (!user.isAdmin && this.ldapParams.isAdmin?.attr && this.ldapParams.isAdmin?.values?.length) {
          debug('check if user is admin', user.email, res.fullResults[0].attrs)
          const values = res.fullResults[0].attrs[this.ldapParams.isAdmin.attr] ?? []
          for (const value of values) {
            if (this.ldapParams.isAdmin?.values.includes(value)) user.isAdmin = true
          }
        }
        const adminsOrg = config.adminsOrg
        if (user.isAdmin && adminsOrg && !user.organizations.find(o => o.id === adminsOrg.id)) {
          user.organizations.push({ ...adminsOrg, role: 'admin' })
        }
      }
      if (config.onlyCreateInvited) user.ignorePersonalAccount = true
      user.name = user.name || userName(user)
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

    const client = ldap.createClient({ url: this.ldapParams.url, reconnect: false, timeout: 4000, ...this.ldapParams.clientOptions })
    const bind = promisify(client.bind).bind(client)
    try {
      debug('try to bind user', dn)
      await bind(dn, password)
      return true
    } catch (err) {
      debug('auth failure', id, err)
      return false
    } finally {
      client.destroy()
    }
  }

  async addUserSession (userId: string, serverSession: ServerSession): Promise<void> {
    await mongo.ldapUserSessions.updateOne({ _id: userId }, { $push: { sessions: serverSession } }, { upsert: true })
  }

  async deleteUserSession (userId: string, serverSessionId: string): Promise<void> {
    await mongo.ldapUserSessions.updateOne({ _id: userId }, { $pull: { sessions: { id: serverSessionId } } })
  }

  // ids, q, sort, select, skip, size
  async findUsers (params: FindUsersParams) {
    debug('find users', params)
    const { results: ogResults, fromCache } = await this.getAllUsers()
    let results = ogResults
    const ids = params.ids
    if (ids) {
      results = results.filter(user => ids.find(id => user.id === id))
    }
    if (params.q) {
      const lq = params.q.toLowerCase()
      results = results.filter(user => user.name.toLowerCase().indexOf(lq) >= 0)
    }
    if (params.sort && Object.keys(params.sort).length && results === ogResults) {
      results = [...results]
    }
    results.sort(sortCompare(params.sort))

    const count = results.length
    const skip = params.skip || 0
    const size = params.size || 20
    results = results.slice(skip, skip + size)
    return { count, results, fromCache }
  }

  private membersCache: { [orgId: string]: { members: Member[], fromCache: string } } = {}
  private _findAllMembers = (orgId: string, users: User[], fetchDate: string) => {
    // if users did not change (same reference from cache), return the cached members
    if (this.membersCache[orgId]?.fromCache === fetchDate) return this.membersCache[orgId].members
    const members: Member[] = []
    for (const user of users) {
      for (const userOrga of user.organizations.filter(o => o.id === orgId)) {
        members.push({
          id: user.id,
          name: user.name,
          email: user.email,
          role: userOrga.role,
          department: userOrga.department,
          emailConfirmed: true
        })
      }
    }
    this.membersCache[orgId] = { members, fromCache: fetchDate }
    return members
  }

  async findMembers (organizationId: string, params: FindMembersParams) {
    debug('find members', params)
    const { results: users, fromCache, fetchDate } = await this.getAllUsers()
    const ogResults = this._findAllMembers(organizationId, users, fetchDate)
    let results = ogResults
    const ids = params.ids
    if (ids) {
      results = results.filter(member => ids.find(id => member.id === id))
    }
    if (params.q) {
      const lq = params.q.toLowerCase()
      results = results.filter(member => member.name.toLowerCase().indexOf(lq) >= 0)
    }
    const roles = params.roles
    if (roles?.length) {
      results = results.filter(member => roles.includes(member.role))
    }
    const deps = params.departments
    if (deps?.length) {
      results = results.filter(member => member.department && deps.includes(member.department))
    }
    if (params.sort && Object.keys(params.sort).length && results === ogResults) {
      results = [...results]
    }
    results.sort(sortCompare(params.sort))
    const count = results.length
    const skip = params.skip || 0
    const size = params.size || 20
    results = results.slice(skip, skip + size)
    return {
      count,
      results,
      fromCache
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

  async patchMember (orgId: string, userId: string, department = null, role = null, patch: PatchMemberBody) {
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
      if (!this.org && config.adminsOrg && config.adminsOrg.id === id) {
        org = { ...config.adminsOrg, departments: [] }
      } else {
        // we cannot performe a ldap search with a filter on the id as we slugify it
        // so we need to fetch all orgs and filter in memory
        const slugId = slugify.default(id, { lower: true, strict: true })
        const allOrgs = await this.getAllOrgs()
        org = allOrgs.results.find(o => o.id === slugId)
      }
    }
    return org as Organization
  }

  async _getOrganizationWithDeps (client: ldap.Client, id: string) {
    const org = await this._getOrganization(client, id)
    if (!org) return org
    if (!org.departments && this.ldapParams.members.department?.attr) {
      const allMembers = await this.findMembers(org.id, { skip: 0, size: 100000 })
      const memberDeps = [...new Set(allMembers.results.map(m => m.department).filter(d => !!d))].sort() as string[]
      org.departments = memberDeps.map(dep => ({ id: dep, name: dep }))
    }
    org.departments = org.departments || []
    return org
  }

  getOrganization = memoize((id: string) => {
    return this.withClient(async (client) => {
      return this._getOrganizationWithDeps(client, id)
    })
  }, { maxAge: config.storage.ldap.cacheMS })

  async findOrganizations (params: FindOrganizationsParams) {
    debug('find orgs', params)
    if (this.ldapParams.organizations.staticSingleOrg) {
      return {
        count: 1,
        results: [this.ldapParams.organizations.staticSingleOrg]
      }
    }
    const { results: ogResults, fromCache } = await this.getAllOrgs()
    let results = ogResults
    if (params.q) {
      const lq = params.q.toLowerCase()
      results = results.filter(user => user.name.toLowerCase().indexOf(lq) >= 0)
    }
    if (params.sort && Object.keys(params.sort).length && results === ogResults) {
      results = [...results]
    }
    results.sort(sortCompare(params.sort))
    const count = results.length
    const skip = params.skip || 0
    const size = params.size || 20
    results = results.slice(skip, skip + size)
    return { count, results, fromCache }
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

  async _createUser (user: Omit<UserWritable, 'password'> & { password?: string }, extraAttrs: Record<string, string | string[]> = {}) {
    const entry = this.userMapping.to({ ...user, lastName: user.lastName || 'missing', name: userName(user) })
    if (user.password) entry.userPassword = user.password
    const dn = this.userDN(user)
    if (this.ldapParams.members.role.attr) {
      for (const userOrg of user.organizations) {
        const roleValues = this.ldapParams.members.role.values?.[userOrg.role]
        const roleValue = roleValues?.[0]
        entry[this.ldapParams.members.role.attr] = entry[this.ldapParams.members.role.attr] ?? []
        entry[this.ldapParams.members.role.attr].push(roleValue || this.ldapParams.members.role.default)
      }
    }

    Object.assign(entry, extraAttrs)
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

  createUser (user: UserWritable, byUser?: { id: string; name: string }, site?: Site): Promise<User> {
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

  async findInactiveUsers () {
    return []
  }

  async findUsersToDelete () {
    return []
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

  clearCache () {
    this.allUsersCache = {}
    this.allOrgsCache = {}
    this.getOrganization.clear()
  }
}

export const init = async (params: LdapParams, org?: Organization) => new LdapStorage(params, org).init()
export const readonly = true
export const overwrite = config.storage.ldap.overwrite
