import { jwtVerify, type JWTPayload } from 'jose'
import { httpError, reqSession } from '@data-fair/lib-express'
import type { Request } from 'express'
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
  // TODO companion PR @data-fair/lib-express: add nhi to SessionState['user']
  if (sessionUser && (sessionUser as any).nhi) throw httpError(403, 'forbidden for non-human identities')
}
