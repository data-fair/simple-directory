import { jwtVerify, type JWTPayload } from 'jose'
import { httpError, reqSession } from '@data-fair/lib-express'
import type { Request } from 'express'
import { nanoid } from 'nanoid'
import mongo from '#mongo'
import storages from '#storages'
import type { Organization, User, UserWritable } from '#types'
import { getKeyResolver } from './keys.ts'

export const verifyAssertion = async (assertion: string, provider: { issuer: string, jwks?: any }, subject: string, audience: string): Promise<JWTPayload> => {
  const keyResolver = await getKeyResolver(provider)
  const { payload } = await jwtVerify(assertion, keyResolver, {
    issuer: provider.issuer,
    audience,
    subject,
    requiredClaims: ['exp', 'sub', 'iat']
  })
  return payload
}

export const assertNotNhiSession = (req: Request) => {
  const sessionUser = reqSession(req).user
  if (sessionUser?.nhi) throw httpError(403, 'forbidden for non-human identities')
}

export const getNhi = async (organizationId: string, nhiId: string): Promise<User> => {
  const user = await storages.globalStorage.getUser(nhiId)
  if (!user?.nhi || user.organizations?.[0]?.id !== organizationId || user.organizations.length !== 1) {
    throw httpError(404, 'nhi not found')
  }
  return user
}

export const listNhis = async (organizationId: string) => {
  // mongo-only feature (v1): direct query, NHI details (subject/provider) are needed by the admin UI
  const filter = { 'organizations.id': organizationId, nhi: { $exists: true } }
  const [count, docs] = await Promise.all([
    mongo.users.countDocuments(filter),
    mongo.users.find(filter).sort({ name: 1 }).limit(1000).toArray()
  ])
  return {
    count,
    results: docs.map(d => ({
      id: d._id,
      name: d.name,
      role: d.organizations[0].role,
      department: d.organizations[0].department,
      departmentName: d.organizations[0].departmentName,
      subject: d.nhi!.subject,
      provider: d.nhi!.provider,
      created: d.created,
      logged: d.logged
    }))
  }
}

export const createNhi = async (org: Organization, body: { name: string, role: string, department?: string, subject: string, provider: { issuer: string, jwks?: any } }, byUser: { id: string, name: string }): Promise<User> => {
  const membership: User['organizations'][0] = { id: org.id, name: org.name, role: body.role, createdAt: new Date().toISOString() }
  if (body.department) {
    const dep = org.departments?.find(d => d.id === body.department)
    if (!dep) throw httpError(400, 'unknown department')
    membership.department = dep.id
    membership.departmentName = dep.name
  }
  const user: UserWritable = {
    id: 'nhi-' + nanoid(10),
    name: body.name,
    ignorePersonalAccount: true,
    organizations: [membership],
    nhi: { provider: body.provider, subject: body.subject }
  } as UserWritable
  return storages.globalStorage.createUser(user, byUser)
}
