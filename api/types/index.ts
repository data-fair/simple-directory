import { type User } from './user/index.ts'
import { type OrganizationMembership } from '@data-fair/lib-common-types/session/index.js'

export type { User } from './user/index.ts'
export type { Organization } from './organization/index.ts'
export type { Site } from './site/index.ts'
export type { SitePublic } from './site-public/index.ts'
export type { Limits } from './limits/index.ts'
export type { Invitation } from './invitation/index.ts'
export type { Partner } from './partner/index.ts'
export type { LdapParams, MemberOverwrite, OrganizationOverwrite } from './ldap-params/index.ts'

export type UserWritable = Omit<User, 'created' | 'updated' | 'name'>

export type Member = Pick<User, 'email' | 'emailConfirmed' | 'host' | 'plannedDeletion'> & OrganizationMembership

export type OAuthToken = {
  token: any,
  provider: { type: string, id: string, title: string },
  user: { id: string, name: string, email: string },
  offlineRefreshToken?: boolean,
  loggedOut?: Date
}
