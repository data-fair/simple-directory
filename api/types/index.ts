import { type User, type FullOrganizationMembership } from './user/index.ts'
import type { RedirectMode } from '../config/type/index.ts'
import type { Invitation } from './invitation/index.ts'

export type { User, FullOrganizationMembership, ServerSession } from './user/index.ts'
export type { Organization } from './organization/index.ts'
export type { Site } from './site/index.ts'
export type { SitePublic } from './site-public/index.ts'
export type { Limits } from './limits/index.ts'
export type { Invitation } from './invitation/index.ts'
export type { Partner } from './partner/index.ts'
export type { LdapParams, MemberOverwrite, OrganizationOverwrite } from './ldap-params/index.ts'
export type { PasswordList } from './password-list/index.ts'

export type UserWritable = Omit<User, 'created' | 'updated' | 'name' | 'sessions'>

export type Member = Pick<User, 'id' | 'name' | 'email' | 'emailConfirmed' | 'host' | 'plannedDeletion'> & Pick<FullOrganizationMembership, 'createdAt' | 'role' | 'department' | 'departmentName' | 'readOnly'>

export type Application = {
  id: string
  name: string
  redirectUris: string[]
}

export type OAuthToken = {
  token: any,
  provider: { type: string, id: string, title: string },
  user: { id: string, name: string, email: string },
  site?: string | null,
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
  rd: Invitation['redirect'],
  d?: Invitation['department'],
  ds?: Invitation['departments']
}

export type ActionPayload = {
  id: string,
  email: string,
  action: 'changePassword' | 'changeHost',
  // For `action: 'changeHost'` the target host/path are bound into the token so that the
  // bearer cannot redirect the user record to an arbitrary site.
  host?: string,
  path?: string,
  // For `action: 'changePassword'`: optional URL to send the user back to after the
  // renewal. Used when a user of a non-standalone secondary site has their renewal
  // email retargeted to their account-main site — the redirect brings them back to
  // the original site. Bound into the token so the post-renewal redirect cannot be
  // swapped by a crafted URL.
  redirect?: string
}

export type ShortenedPartnerInvitation = {
  o: string,
  on: string,
  p: string,
  n: string,
  e: string
}

export type SessionInfoPayload = {
  session: string
  user: string
  adminMode?: 1
}
