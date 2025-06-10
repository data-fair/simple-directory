import useragent from 'useragent'
import debugModule from 'debug'
import config from '#config'
import type { Request } from 'express'
import { session, httpError, type OrganizationMembership } from '@data-fair/lib-express'
import eventsLog, { type EventLogContext } from '@data-fair/lib-express/events-log.js'
import type { Site, User, Organization, ServerSession, UserWritable } from '#types'
import storages from '#storages'
import eventsQueue from '#events-queue'
import { nanoid } from 'nanoid'
import type { CreateMember, AuthProvider, MemberRole, MemberDepartment, OpenIDConnect } from '#types/site/index.ts'
import { getOrgLimits, getRedirectSite, getTokenPayload, prepareCallbackUrl, reqSite, setNbMembersLimit, unshortenInvit } from '#services'
import { __all, reqI18n } from '#i18n'

const debugAuthProvider = debugModule('auth-provider')

type AuthProviderMemberInfo = { create: boolean, org?: Organization, readOnly: boolean, role: string, department?: string }

type AuthProviderCore = {
  id: string,
  type: 'saml2' | 'oidc' | 'oauth',
  createMember?: CreateMember,
  memberRole?: MemberRole,
  memberDepartment?: MemberDepartment,
  coreIdProvider?: boolean
}

type AuthProviderRef = Pick<AuthProviderCore, 'id' | 'type'>

type AuthProviderUserAttrs = { email: string, name?: string, firstName?: string, lastName?: string, avatarUrl?: string, coreIdProvider?: AuthProviderRef }

type AuthProviderAuthInfo = {
  data: any,
  user: AuthProviderUserAttrs,
  logged?: string,
  coreId?: boolean
}

export const authProviderMemberInfo = async (site: Site | undefined, provider: AuthProviderCore, authInfo: AuthProviderAuthInfo): Promise<AuthProviderMemberInfo> => {
  let create = false
  if ((provider.createMember as unknown as boolean) === true) {
    // retro-compatibility for when createMember was a boolean
    create = true
  } else if (provider.createMember && provider.createMember.type === 'always') {
    create = true
  } else if (provider.createMember && provider.createMember.type === 'emailDomain' && authInfo.user.email.endsWith(`@${provider.createMember.emailDomain}`)) {
    create = true
  }

  let org
  if (create) {
    const orgId = site ? site.owner.id : config.defaultOrg
    if (!orgId) throw new Error('createMember option on auth provider requires defaultOrg to be defined')
    org = await storages.globalStorage.getOrganization(orgId)
    if (!org) throw new Error(`Organization not found ${orgId}`)
  }

  let role
  let readOnly = false
  if (provider.coreIdProvider && ((provider.memberRole && provider.memberRole?.type !== 'none') || (provider.memberDepartment && provider.memberDepartment?.type !== 'none'))) {
    readOnly = true
  }
  let department: string | undefined
  if (org) {
    const roles = org.roles || config.roles.defaults
    if (provider.memberRole?.type === 'static') {
      role = provider.memberRole.role
    }
    if (provider.memberRole?.type === 'attribute') {
      role = authInfo.data[provider.memberRole.attribute] ?? role
      if (provider.memberRole.values) {
        for (const [key, values] of Object.entries(provider.memberRole.values)) {
          if (values.includes(role)) {
            role = key
            break
          }
        }
      }
      if (provider.memberRole.defaultRole && (!role || !roles.includes(role))) {
        role = provider.memberRole.defaultRole
      }
    }
    if (!role) role = 'user'
    if (!roles.includes(role)) {
      throw httpError(400, `Rôle ${role} inconnu dans l'organisation ${org.id}`)
    }
    if (provider.memberDepartment?.type === 'static') {
      department = provider.memberDepartment.department
    }
    if (provider.memberDepartment?.type === 'attribute') {
      department = authInfo.data[provider.memberDepartment.attribute] as string | undefined
      if (!department && provider.memberDepartment.required) {
        throw httpError(400, "l'attribute de département n'est pas défini et est obligatoire")
      }
      if (provider.memberDepartment.orgRootValue && department === provider.memberDepartment.orgRootValue) {
        department = undefined
      }
    }
    if (org && department) {
      const matchedDepartment = org.departments?.find(dep => dep.id === department || dep.name === department)
      if (!matchedDepartment) {
        throw httpError(400, `Department ${department} not found in organization ${org.id}`)
      }
      department = matchedDepartment.id
    }
  }

  return { create, org, readOnly, role, department }
}

export const authProviderLoginCallback = async (
  req: Request,
  invitToken: string | undefined,
  authInfo: AuthProviderAuthInfo,
  logContext: EventLogContext,
  provider: AuthProviderCore,
  redirect: string,
  org: string | undefined,
  dep: string | undefined,
  adminMode: boolean | undefined
): Promise<[string, User]> => {
  const storage = storages.globalStorage
  const site = await reqSite(req)
  authInfo = { ...authInfo, logged: new Date().toISOString() }

  // used to create a user and accept a member invitation at the same time
  // if the invitation is not valid, better not to proceed with the user creation
  let invit, invitOrga
  if (invitToken) {
    try {
      invit = unshortenInvit(await session.verifyToken(invitToken))
      eventsLog.info('sd.auth.provider.invit', `a user was invited to join an organization ${invit.id}`, logContext)
    } catch (err: any) {
      throw httpError(400, err.name === 'TokenExpiredError' ? 'expiredInvitationToken' : 'invalidInvitationToken')
    }
    invitOrga = await storage.getOrganization(invit.id)
    if (!invitOrga) throw httpError(400, 'orgaUnknown')
    if (invit.email !== authInfo.user.email) throw httpError(400, 'badProviderInvitEmail')
  }

  // check for user with same email
  let user = await storage.getUserByEmail(authInfo.user.email, site)
  logContext.user = user

  if (!user && storage.readonly) {
    throw httpError(403, 'userUnknown')
  }

  // Re-create a user that was never validated.. first clean temporary user
  if (user && user.emailConfirmed === false) {
    if (user.organizations && invit) {
      // This user was created empty from an invitation in 'alwaysAcceptInvitations' mode
    } else {
      eventsLog.info('sd.auth.provider.del-temp-user', `a temporary user was deleted in oauth callback ${user.id}`, logContext)
      await storage.deleteUser(user.id)
      user = undefined
    }
  }

  const memberInfo = await authProviderMemberInfo(site, provider, authInfo)

  if (!user && !invit && config.onlyCreateInvited && !memberInfo.create) {
    throw httpError(400, 'onlyCreateInvited')
  }

  if (invit && memberInfo.create) throw new Error('Cannot create a member from a identity provider and accept an invitation at the same time')
  if (!user) {
    const newUser: UserWritable = {
      ...authInfo.user,
      id: nanoid(),
      emailConfirmed: true,
      [provider.type]: {
        [provider.id]: { ...authInfo, coreId: provider.coreIdProvider ? true : undefined }
      },
      coreIdProvider: provider.coreIdProvider ? { type: provider.type, id: provider.id } : undefined,
      organizations: []
    }
    if (site) {
      if (['onlyBackOffice', 'onlyOtherSites', undefined].includes(site.authMode)) {
        throw httpError(400, 'Cannot create a user on a secondary site')
      }
      newUser.host = site.host
      if (site.path) newUser.path = site.path
    }
    if (invit && invitOrga) {
      newUser.defaultOrg = invitOrga.id
      newUser.ignorePersonalAccount = true
    } else if (memberInfo.create && memberInfo.org) {
      newUser.defaultOrg = memberInfo.org.id
      newUser.ignorePersonalAccount = true
    }
    debugAuthProvider('Create user authenticated through oauth', user)
    logContext.user = user
    eventsLog.info('sd.auth.provider.create-user', `a user was created in oauth callback ${newUser.id}`, logContext)
    const redirectSite = await getRedirectSite(req, redirect)
    user = await storage.createUser(newUser, undefined, redirectSite)

    if (memberInfo.create && memberInfo.org) {
      logContext.account = { type: 'organization', ...memberInfo.org }
      eventsLog.info('sd.auth.provider.create-member', `a user was added as a member in oauth callback ${user.id} / ${memberInfo.role}`, logContext)
      await storage.addMember(memberInfo.org, user, memberInfo.role, memberInfo.department, memberInfo.readOnly)
      await setNbMembersLimit(memberInfo.org.id)
    }
  } else if (!storage.readonly) {
    if (user.coreIdProvider && (user.coreIdProvider.type !== (provider.type || 'oauth') || user.coreIdProvider.id !== provider.id)) {
      throw httpError(400, 'Utilisateur déjà lié à un autre fournisseur d\'identité principale')
    }
    debugAuthProvider('Existing user authenticated through oauth', user, authInfo)
    user = await patchCoreAuthUser(provider, user, authInfo, memberInfo)
  }

  if (invit && invitOrga && !config.alwaysAcceptInvitation) {
    const limits = await getOrgLimits(invitOrga)
    if (limits.store_nb_members.limit > 0 && limits.store_nb_members.consumption >= limits.store_nb_members.limit) {
      throw httpError(400, reqI18n(req).messages.errors.maxNbMembers)
    }

    await storage.addMember(invitOrga, user, invit.role, invit.department)
    eventsLog.info('sd.auth.provider.accept-invite', `a user accepted an invitation in oauth callback ${user.id}`, logContext)
    eventsQueue?.pushEvent({
      sender: { type: 'organization', id: invitOrga.id, name: invitOrga.name, role: 'admin', department: invit.department },
      topic: { key: 'simple-directory:invitation-accepted' },
      title: __all('notifications.acceptedInvitation', { name: user.name, email: user.email, orgName: invitOrga.name + (invit.department ? ' / ' + invit.department : '') })
    })
    await setNbMembersLimit(invitOrga.id)
  }

  const payload = getTokenPayload(user, site)
  if (adminMode) {
    // TODO: also check that the user actually inputted the password on this redirect
    if (payload.isAdmin) payload.adminMode = 1
    else {
      eventsLog.alert('sd.auth.oauth.not-admin', 'a unauthorized user tried to activate admin mode', logContext)
      throw httpError(403, 'adminModeOnly')
    }
  }
  let userOrg: Pick<OrganizationMembership, 'id' | 'department'> | undefined
  if (invit && invitOrga) userOrg = { id: invit.id, department: invit.department }
  else if (org) userOrg = { id: org, department: dep }
  const linkUrl = await prepareCallbackUrl(req, payload, redirect, userOrg)
  debugAuthProvider(`Auth provider based authentication of user ${user.name}`)

  return [linkUrl.href, user]
}

export const patchCoreAuthUser = async (provider: AuthProviderCore, user: User, authInfo: AuthProviderAuthInfo, memberInfo: AuthProviderMemberInfo) => {
  if (provider.coreIdProvider) {
    authInfo.coreId = true
    authInfo.user.coreIdProvider = { type: provider.type, id: provider.id }
  }
  const existingAuthInfo = user[provider.type]?.[provider.id] as any
  const patch: Partial<User> = {
    [provider.type]: { ...user[provider.type] },
    emailConfirmed: true
  }
  const userProviders = patch[provider.type] = patch[provider.type] ?? {}
  userProviders[provider.id] = { ...existingAuthInfo, ...authInfo }
  if (provider.coreIdProvider) {
    Object.assign(patch, authInfo.user)
    if (memberInfo.readOnly && memberInfo.org) {
      if (memberInfo.create) {
        patch.defaultOrg = memberInfo.org.id
        patch.ignorePersonalAccount = true
        await storages.globalStorage.addMember(memberInfo.org, user, memberInfo.role, memberInfo.department, memberInfo.readOnly)
      } else {
        await storages.globalStorage.removeMember(memberInfo.org.id, user.id, '*')
      }
      await setNbMembersLimit(memberInfo.org.id)
    }
  } else {
    if (authInfo.user.firstName && !user.firstName) patch.firstName = authInfo.user.firstName
    if (authInfo.user.lastName && !user.lastName) patch.lastName = authInfo.user.lastName
  }
  return await storages.globalStorage.patchUser(user.id, patch)
}

export const initServerSession = (req: Request): ServerSession => {
  const agentHeader = req.get('user-agent')
  const deviceName = agentHeader ? useragent.parse(agentHeader).toString() : 'appareil inconnu'
  return {
    id: nanoid(),
    createdAt: new Date().toISOString(),
    deviceName
  }
}

export const isOIDCProvider = (provider: AuthProvider): provider is OpenIDConnect => {
  return provider.type === 'oidc'
}
