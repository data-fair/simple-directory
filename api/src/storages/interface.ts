import type { User, UserWritable, Organization, Site, Member } from '#types'
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
  sort?: any
}

export interface SdStorageFactory {
  init(conf: any, org?: Organization): Promise<SdStorage>
  readonly?: boolean
}

export interface SdStorage {
  init(conf: any, org?: Organization): Promise<void>

  readonly?: boolean

  getUser(userId: string): Promise<User | undefined>
  createUser(user: UserWritable, byUser?: { id: string, name: string }, host?: string): Promise<User>
  getUserByEmail(email: string, site?: Site): Promise<User>
  updateLogged(userId: string): Promise<void>

  getOrganization(ordId: string): Promise<Organization | undefined>
  createOrganization(org: Organization, user: UserRef): Promise<void>

  getPassword(userId: string): Password
  checkPassword(userId: string, password: string): Promise<boolean>
  get2FA(userId: string): Promise<TwoFA>
  set2FA(userId: string, twoFA: TwoFA): Promise<void>

  addMember (orga: Organization, user: User, role: string, department: string | undefined | null, readOnly?: boolean): Promise<void>
  findMembers (organizationId: string, params: FindMembersParams): Promise<{ count: number, results: Member[] }>
}
