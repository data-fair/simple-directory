import type { User, UserWritable, Organization, Site, Member, Partner, ServerSession } from '#types'
import type { OrganizationPost } from '#doc/organizations/post-req/index.ts'
import type { PatchMemberBody } from '#doc/organizations/patch-member-req/index.ts'
import type { UserRef } from '@data-fair/lib-express'
import type { TwoFA, Password } from '#services'

export type FindMembersParams = {
  q?: string,
  ids?: string[],
  roles?: string[],
  departments?: string[],
  size: number,
  skip: number,
  sort?: any,
  emailConfirmed?: boolean
}

export type FindOrganizationsParams = {
  q?: string,
  ids?: string[],
  size: number,
  skip: number,
  sort?: any,
  creator?: string,
  select?: string[]
}

export type FindUsersParams = {
  q?: string,
  ids?: string[],
  size: number,
  skip: number,
  sort?: any,
  select?: string[]
}

export interface SdStorageFactory {
  init(conf: any, org?: Organization): Promise<SdStorage>
  readonly?: boolean
}

export interface SdStorage {
  init(conf: any, org?: Organization): Promise<SdStorage>

  readonly?: boolean

  findUsers (params: FindUsersParams): Promise<{ count: number, results: User[] }>
  getUser(userId: string): Promise<User | undefined>
  createUser(user: UserWritable, byUser?: { id: string, name: string }): Promise<User>
  getUserByEmail(email: string, site?: Site): Promise<User | undefined>
  updateLogged(userId: string, serverSessionId: string): Promise<void>
  confirmEmail(userId: string): Promise<void>
  deleteUser(userId: string): Promise<void>
  patchUser (userId: string, patch: any, byUser?: { id: string, name: string }): Promise<User>
  findInactiveUsers (): Promise<User[]>
  findUsersToDelete (): Promise<User[]>
  addUserSession (userId: string, serverSession: ServerSession): Promise<void>
  deleteUserSession (userId: string, serverSessionId: string): Promise<void>
  deleteOldSessions (): Promise<void>

  getOrganization(ordId: string): Promise<Organization | undefined>
  createOrganization(org: OrganizationPost, user: UserRef): Promise<Organization>
  findOrganizations(params: FindOrganizationsParams): Promise<{ count: number, results: Organization[] }>
  patchOrganization(orgId: string, patch: any, user: UserRef): Promise<Organization>
  deleteOrganization(orgId: string): Promise<void>

  getPassword?(userId: string): Promise<Password | undefined>
  checkPassword?(userId: string, password: string): Promise<boolean>
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
