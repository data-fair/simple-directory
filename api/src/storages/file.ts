import { resolve } from 'node:path'
import type { FindMembersParams, FindOrganizationsParams, FindUsersParams, SdStorage } from './interface.ts'
import type { FileParams } from '../../config/type/index.ts'
import config from '#config'
import userName from '../utils/user-name.ts'
import type { Member, Organization, Partner, User, UserWritable, ServerSession, Site } from '#types'
import { readFileSync, existsSync } from 'node:fs'
import type { Password } from '../utils/passwords.ts'
import type { PatchMemberBody } from '#doc/organizations/patch-member-req/index.ts'
import type { OrganizationPost } from '#doc/organizations/post-req/index.ts'
import type { UserRef } from '@data-fair/lib-express'
import type { TwoFA } from '#services'
import mongo from '#mongo'

type StoredOrganization = Omit<Organization, 'members'> & { members: { id: string, role: string, department?: string }[] }

function applySelect (resources: Record<string, any>, select?: string[]) {
  if (!select || !select.length) return resources
  return resources.map((resource: Record<string, any>) => select.reduce((r, key) => { r[key] = resource[key]; return r }, {} as Record<string, any>))
}

function getUserOrgas (organizations: StoredOrganization[], user: User) {
  const userOrgas = []
  for (const orga of organizations) {
    for (const member of orga.members) {
      if (member.id === user.id) {
        userOrgas.push({
          ...member,
          id: orga.id,
          name: orga.name
        })
      }
    }
  }
  return userOrgas
}

function sortCompare (sort: Record<string, 1 | -1>) {
  return function (a: Record<string, any>, b: Record<string, any>) {
    for (const key of Object.keys(sort || {})) {
      if (a[key] > b[key]) return sort[key]
      if (a[key] < b[key]) return sort[key] * -1
    }
    return 0
  }
}

class FileStorage implements SdStorage {
  private users: Omit<User, 'sessions'>[]
  private organizations: StoredOrganization[]

  constructor (params: FileParams, org?: Organization) {
    if (org) throw new Error('file storage is not compatible with per-org storage')
    const newUsersPath = resolve(import.meta.dirname, '../../..', params.users)
    const oldUsersPath = '/webapp/data/users.json'
    if (existsSync(oldUsersPath)) {
      console.error(`WARNING: found a users file at deprecated path ${oldUsersPath}, please use new path ${newUsersPath}`)
      this.users = JSON.parse(readFileSync(oldUsersPath, 'utf-8'))
    } else {
      this.users = JSON.parse(readFileSync(newUsersPath, 'utf-8'))
    }
    for (const user of this.users) {
      user.name = userName(user)
    }

    const newOrgsPath = resolve(import.meta.dirname, '../../..', params.organizations)
    const oldOrgsPath = '/webapp/data/organizations.json'
    if (existsSync(oldOrgsPath)) {
      console.error(`WARNING: found a organizations file at deprecated path ${oldOrgsPath}, please use new path ${newOrgsPath}`)
      this.organizations = JSON.parse(readFileSync(oldOrgsPath, 'utf-8'))
    } else {
      this.organizations = JSON.parse(readFileSync(newOrgsPath, 'utf-8'))
    }
    for (const orga of this.organizations) {
      orga.members = orga.members || []
      orga.departments = orga.departments || []
    }
  }

  readonly = true

  async init () {
    return this
  }

  cleanUser (user: any): User {
    const res = { ...user, organizations: getUserOrgas(this.organizations, user) }
    delete res.password
    res.isAdmin = config.admins.includes(res.email.toLowerCase())
    if (config.onlyCreateInvited) res.ignorePersonalAccount = true
    return res
  }

  cleanOrga (org: StoredOrganization): Organization {
    return { ...org, members: undefined }
  }

  async getUser (id: string) {
    // Find user by strict equality of properties passed in filter
    const user = this.users.find(u => u.id === id) as User | undefined
    if (!user) return
    user.sessions = (await mongo.fileUserSessions.findOne({ _id: user.id }))?.sessions
    return this.cleanUser(user)
  }

  async getUserByEmail (email: string) {
    // Case insensitive comparison
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) as User | undefined
    if (!user) return
    user.sessions = (await mongo.fileUserSessions.findOne({ _id: user.id }))?.sessions
    return this.cleanUser(user)
  }

  async getPassword (userId: string) {
    // Case insensitive comparison
    const user = this.users.find(u => u.id === userId)
    return user?.password as Password
  }

  async addUserSession (userId: string, serverSession: ServerSession): Promise<void> {
    await mongo.fileUserSessions.updateOne({ _id: userId }, { $push: { sessions: serverSession } }, { upsert: true })
  }

  async deleteUserSession (userId: string, serverSessionId: string): Promise<void> {
    await mongo.fileUserSessions.updateOne({ _id: userId }, { $pull: { sessions: { id: serverSessionId } } })
  }

  async findUsers (params: FindUsersParams) {
    let filteredUsers = this.users.map(user => this.cleanUser(user))
    const ids = params.ids
    if (ids?.length) {
      filteredUsers = filteredUsers.filter(user => ids.find(id => user.id === id))
    }
    if (params.host) {
      filteredUsers = filteredUsers.filter(user => user.host === params.host)
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

  async findMembers (organizationId: string, params: FindMembersParams) {
    const orga = this.organizations.find(o => o.id === organizationId)
    if (!orga) throw Error('unknown organization ' + organizationId)
    let members: Member[] = (orga.members ?? []).map(m => {
      const user = this.users.find(u => u.id === m.id)
      if (!user) throw Error('unknown user as member ' + m.id)
      return { ...m, name: user.name, email: user.email, host: user.host, emailConfirmed: user.emailConfirmed, plannedDeletion: user.plannedDeletion }
    })
    const ids = params.ids
    if (ids?.length) {
      members = members.filter(member => ids.includes(member.id))
    }
    const roles = params.roles
    if (roles?.length) {
      members = members.filter(member => roles.includes(member.role))
    }
    const departments = params.departments
    if (departments?.length) {
      members = members.filter(member => {
        for (const dep of departments) {
          if (dep === '-' && !member.department) return true
          if (dep === member.department) return true
        }
        return false
      })
    }
    if (params.q) {
      const lq = params.q.toLowerCase()
      members = members.filter(member => member.name.toLowerCase().indexOf(lq) >= 0)
    }
    for (const member of members.filter(m => m.department)) {
      const dep = orga.departments && orga.departments.find(d2 => d2.id === member.department)
      if (dep) member.departmentName = dep.name
    }
    return {
      count: members.length,
      results: members.sort(sortCompare(params.sort)).slice(params.skip, params.skip + params.size)
    }
  }

  async getOrganization (id: string) {
    const orga = this.organizations.find(o => o.id === id)
    if (!orga) return null
    const cloneOrga = JSON.parse(JSON.stringify(orga))
    delete cloneOrga.members
    return cloneOrga
  }

  async findOrganizations (params: FindOrganizationsParams) {
    let filteredOrganizations = this.organizations.map(orga => this.cleanOrga(orga))
    // For convenience in the files the members are stored in the organizations
    // But the actual model exposed is the contrary
    const ids = params.ids
    if (ids?.length) {
      filteredOrganizations = filteredOrganizations.filter(organization => ids.find(id => organization.id === id))
    }
    if (params.host) {
      filteredOrganizations = filteredOrganizations.filter(organization => organization.host === params.host)
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

  async required2FA (user: User) {
    if (user.isAdmin && config.admins2FA) return true
    return false
  }

  async get2FA (userId: string) {
    return undefined
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

  patchOrganization (orgId: string, patch: any, user: UserRef): Promise<Organization> {
    throw new Error('Method not implemented.')
  }

  deleteOrganization (orgId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  checkPassword? (userId: string, password: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  set2FA (userId: string, twoFA: TwoFA): Promise<void> {
    throw new Error('Method not implemented.')
  }

  addMember (orga: Organization, user: UserRef, role: string, department?: string | null, readOnly?: boolean): Promise<void> {
    throw new Error('Method not implemented.')
  }

  removeMember (orgId: string, userId: string, department?: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  patchMember (orgId: string, userId: string, department: string | null | undefined, role: string | null | undefined, patch: PatchMemberBody): Promise<void> {
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

export const init = async (params: FileParams, org?: Organization) => new FileStorage(params, org).init()
export const readonly = true
