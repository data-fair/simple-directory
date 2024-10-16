import type { User, Organization } from '#types'
import type { UserRef } from '@data-fair/lib-common-types/session/index.js'

export interface SdStorage {
  init(conf: any): Promise<void>

  readonly?: boolean

  createUser(user: User): Promise<void>
  getUserByEmail(email: string): Promise<User>

  getOrganization(ordId: string): Promise<Organization | undefined>

  createOrganization(org: Organization, user: UserRef): Promise<void>
}
