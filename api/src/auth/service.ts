import config from '#config'
import { type Site } from '#types'
import { type OAuthProvider } from '../oauth/service.ts'
import { type SdStorage } from '../storages/interface.ts'

export const authCoreProviderMemberInfo = async (storage: SdStorage, site: Site, provider: OAuthProvider, email: string, oauthInfo: any) => {
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
    org = await storage.getOrganization(orgId)
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
