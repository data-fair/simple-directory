import type { User, Organization, Site } from '#types'
import type { UserRef } from '@data-fair/lib-express'
import type { Password } from '../utils/passwords.ts'
import type { TwoFA } from '../2fa/service.ts'

export interface SdStorage {
  init(conf: any): Promise<void>

  readonly?: boolean

  createUser(user: User): Promise<void>
  getUserByEmail(email: string, site?: Site): Promise<User>

  getOrganization(ordId: string): Promise<Organization | undefined>

  createOrganization(org: Organization, user: UserRef): Promise<void>

  getPassword(userId: string): Password
  checkPassword(userId: string, password: string): Promise<boolean>
  get2FA(userId: string): Promise<TwoFA>
  set2FA(userId: string, twoFA: TwoFA): Promise<void>
}
