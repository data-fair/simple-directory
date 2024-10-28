import { resolve } from 'node:path'
import type { FindMembersParams, FindOrganizationsParams, FindUsersParams, SdStorage } from './interface.ts'
import type { FileParams } from '../../config/type/index.ts'
import config from '#config'
import userName from '../utils/user-name.ts'
import type { Member, Organization, Partner, User, UserWritable } from '#types'
import { readFileSync } from 'node:fs'
import type { Password } from '../utils/passwords.ts'
import type { PatchMemberBody } from '#doc/organizations/patch-member-req/index.ts'
import type { OrganizationPost } from '#doc/organizations/post-req/index.ts'
import type { UserRef } from '@data-fair/lib-express'
import type { TwoFA } from '#services'

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
  private users: User[]
  private organizations: StoredOrganization[]

  constructor (params: FileParams, org?: Organization) {
    if (org) throw new Error('file storage is not compatible with per-org storage')
    this.users = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../..', params.users), 'utf-8'))
    this.users.forEach(user => {
      user.name = userName(user)
    })
    this.organizations = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../..', params.organizations), 'utf-8'))
    this.organizations.forEach(orga => {
      orga.members = orga.members || []
      orga.departments = orga.departments || []
    })
  }

  readonly = true

  async init () {
    return this
  }

  cleanUser (user: any): User {
    const res = { ...user, organizations: getUserOrgas(this.organizations, user) }
    delete res.password
    return res
  }

  cleanOrga (org: StoredOrganization): Organization {
    return { ...org, members: undefined }
  }

  async getUser (id: string) {
    // Find user by strict equality of properties passed in filter
    const user = this.users.find(u => u.id === id)
    if (!user) return
    return this.cleanUser(user)
  }

  async getUserByEmail (email: string) {
    // Case insensitive comparison
    const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!user) return
    return this.cleanUser(user)
  }

  async getPassword (userId: string) {
    // Case insensitive comparison
    const user = this.users.find(u => u.id === userId)
    return user?.password as Password
  }

  async findUsers (params: FindUsersParams) {
    let filteredUsers = this.users.map(user => this.cleanUser(user))
    const ids = params.ids
    if (ids?.length) {
      filteredUsers = filteredUsers.filter(user => ids.find(id => user.id === id))
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
      return { ...m, name: user.name, email: user.email }
    })
    if (params.q) {
      const lq = params.q.toLowerCase()
      members = members.filter(member => member.name.toLowerCase().indexOf(lq) >= 0)
    }
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

  patchMember (orgId: string, userId: string, department: string | null | undefined, patch: PatchMemberBody): Promise<void> {
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
