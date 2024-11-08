import { type User } from './user/index.ts'
import { type OrganizationMembership } from '@data-fair/lib-common-types/session/index.js'
import type { RedirectMode } from '../config/type/index.ts'
import type { Invitation } from './invitation/index.ts'

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

export type PublicAuthProvider = {
  type: string,
  id: string,
  title?: string,
  color?: string,
  img?: string,
  icon?: string,
  redirectMode?: RedirectMode,
  host?: string
}

export type ShortenedInvitation = {
  id: Invitation['id'],
  n: Invitation['name'],
  e: Invitation['email'],
  r: Invitation['role'],
  d: Invitation['department'],
  dn: Invitation['departmentName'],
  rd: Invitation['redirect'],
}

export type ActionPayload = {
  id: string,
  email: string,
  action: 'changePassword' | 'changeHost'
}

export type ShortenedPartnerInvitation = {
  o: string,
  on: string,
  p: string,
  n: string,
  e: string
}
