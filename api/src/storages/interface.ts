import type { User, UserWritable, Organization, Site, Member, Partner } from '#types'
import { OrganizationPost } from '#doc/organizations/post-req/index.ts'
import { PatchMemberBody } from '#doc/organizations/patch-member-req/index.ts'
import type { UserRef } from '@data-fair/lib-express'
import type { Password } from '../utils/passwords.ts'
import type { TwoFA } from '../2fa/service.ts'

export type FindMembersParams = {
  q?: string,
  ids?: string[],
  roles?: string[],
  departments?: string[],
  size?: number,
  skip?: number,
  sort?: any,
  emailConfirmed?: boolean
}

export type FindOrganizationsParams = {
  q?: string,
  ids?: string[],
  size?: number,
  skip?: number,
  sort?: any,
  creator?: string,
  select?: string[]
}

export type FindUsersParams = {
  q?: string,
  ids?: string[],
  size?: number,
  skip?: number,
  sort?: any,
  select?: string[]
}

export interface SdStorageFactory {
  init(conf: any, org?: Organization): Promise<SdStorage>
  readonly?: boolean
}

export interface SdStorage {
  init(conf: any, org?: Organization): Promise<void>

  readonly?: boolean

  findUsers (params: FindUsersParams): Promise<{ count: number, results: User[] }>
  getUser(userId: string): Promise<User | undefined>
  createUser(user: UserWritable, byUser?: { id: string, name: string }, host?: string): Promise<User>
  getUserByEmail(email: string, site?: Site): Promise<User>
  updateLogged(userId: string): Promise<void>
  confirmEmail(userId: string): Promise<void>
  deleteUser(userId: string): Promise<void>
  patchUser (userId: string, patch: any, byUser?: { id: string, name: string }): Promise<User>
  findInactiveUsers (): Promise<User[]>
  findUsersToDelete (): Promise<User[]>

  getOrganization(ordId: string): Promise<Organization | undefined>
  createOrganization(org: OrganizationPost, user: UserRef): Promise<Organization>
  findOrganizations(params: FindOrganizationsParams): Promise<{ count: number, results: Organization[] }>
  patchOrganization(orgId: string, patch: any, user: UserRef): Promise<Organization>
  deleteOrganization(orgId: string): Promise<void>

  getPassword(userId: string): Password
  checkPassword(userId: string, password: string): Promise<boolean>
  required2FA(user: User): Promise<boolean>
  get2FA(userId: string): Promise<TwoFA | undefined>
  set2FA(userId: string, twoFA: TwoFA): Promise<void>

  addMember (orga: Organization, user: UserRef, role: string, department?: string | null, readOnly?: boolean): Promise<void>
  findMembers (organizationId: string, params: FindMembersParams): Promise<{ count: number, results: Member[] }>
  removeMember (orgId: string, userId: string, department?: string): Promise<void>
  patchMember(orgId: string, userId: string, department: string | null | undefined, patch: PatchMemberBody): Promise<void>

  addPartner (orgId: string, partner: Partner): Promise<void>
  deletePartner (orgId: string, partnerId: string): Promise<void>
  validatePartner (orgId: string, partnerId: string, partner: Organization): Promise<void>
}
