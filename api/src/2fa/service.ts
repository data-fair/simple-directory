import { type Request } from 'express'
import { authenticator } from 'otplib'
import { type Password } from '../utils/passwords.ts'
import { session } from '@data-fair/lib-express'
import type { User } from '#types'
import type { SdStorage } from '../storages/interface.ts'

export const is2FAValid = (secret: string | undefined, token: string) => {
  if (!secret) return false
  return authenticator.check(token, secret)
}

export const cookie2FAName = (userId: string) => 'id_token_2fa_' + userId

export type TwoFA = { active: boolean, secret: string, recovery?: Password }

// whether a login must be validated by a TOTP code: the user completed a 2FA enrolment
// (a pending enrolment only holds a secret, active=false and must not block anything)
// or 2FA is imposed by the platform / one of the user's organizations
export const is2FARequired = async (storage: SdStorage, user: User, user2FA: TwoFA | undefined) => {
  return !!user2FA?.active || await storage.required2FA(user)
}

export const check2FASession = async (req: Request, userId: string) => {
  const token = req.cookies[cookie2FAName(userId)]
  if (!token) return false
  let decoded
  try {
    decoded = await session.verifyToken(token)
  } catch (err) {
    console.error('invalid 2fa token', err)
    return false
  }
  if (decoded.user !== userId) return false
  return true
}
