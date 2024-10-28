import config from '#config'
import type { Site, User, Organization } from '#types'
import { type OAuthProvider } from '../oauth/service.ts'
import storages from '#storages'

type OAuthMemberInfo = { create: boolean, org?: Organization, readOnly: boolean, role: string }

export const authCoreProviderMemberInfo = async (site: Site | undefined, provider: OAuthProvider, email: string, oauthInfo: any): Promise<OAuthMemberInfo> => {
  let create = false
  if ((provider.createMember as unknown as boolean) === true) {
    // retro-compatibility for when createMember was a boolean
    create = true
  } else if (provider.createMember && provider.createMember.type === 'always') {
    create = true
  } else if (provider.createMember && provider.createMember.type === 'emailDomain' && email.endsWith(`@${provider.createMember.emailDomain}`)) {
    create = true
  }

  let org
  if (create) {
    const orgId = site ? site.owner.id : config.defaultOrg
    if (!orgId) throw new Error('createMember option on auth provider requires defaultOf to be defined')
    org = await storages.globalStorage.getOrganization(orgId)
    if (!org) throw new Error(`Organization not found ${orgId}`)
  }

  let role = 'user'
  let readOnly = false
  if (provider.coreIdProvider && provider.memberRole && provider.memberRole?.type !== 'none') {
    readOnly = true
  }
  if (provider.memberRole?.type === 'static') {
    role = provider.memberRole.role
  }
  if (provider.memberRole?.type === 'attribute') {
    role = oauthInfo.data[provider.memberRole.attribute]
  }

  return { create, org, readOnly, role }
}

export const patchCoreOAuthUser = async (provider: OAuthProvider, user: User, oauthInfo: any, memberInfo: OAuthMemberInfo) => {
  const providerType = (provider.type || 'oauth') as 'oidc' | 'oauth'
  if (provider.coreIdProvider) {
    oauthInfo.coreId = true
    oauthInfo.user.coreIdProvider = { type: providerType, id: provider.id }
  }
  const existingOAuthInfo = user[providerType]?.[provider.id] as any
  const patch: Partial<User> = {
    [providerType]: { ...user[providerType] },
    emailConfirmed: true
  }
  const userProviders = patch[providerType] = patch[providerType as 'oidc' | 'oauth'] ?? {}
  userProviders[provider.id] = { ...existingOAuthInfo, ...oauthInfo }
  if (provider.coreIdProvider) {
    Object.assign(patch, oauthInfo.user)
    if (!memberInfo.readOnly && memberInfo.org) {
      if (memberInfo.create) {
        patch.defaultOrg = memberInfo.org.id
        patch.ignorePersonalAccount = true
        await storages.globalStorage.addMember(memberInfo.org, user, memberInfo.role, null, memberInfo.readOnly)
      } else {
        await storages.globalStorage.removeMember(memberInfo.org.id, user.id)
      }
    }
  } else {
    if (oauthInfo.user.firstName && !user.firstName) patch.firstName = oauthInfo.user.firstName
    if (oauthInfo.user.lastName && !user.lastName) patch.lastName = oauthInfo.user.lastName
  }
  return await storages.globalStorage.patchUser(user.id, patch)
}
