import { type Request } from 'express'
import { authenticator } from 'otplib'
import { type Password } from '../utils/passwords.ts'
import { session } from '@data-fair/lib-express'
import type { User } from '#types'
import type { SdStorage } from '../storages/interface.ts'

// accept the codes of the previous and next 30s steps too (RFC 6238 recommends one step of
// tolerance): otplib defaults to the current step only, so a code typed while the
// authenticator app rolls over, or a slight clock drift, was rejected
const totp = authenticator.clone({ window: 1 })

export const is2FAValid = (secret: string | undefined, token: string) => {
  if (!secret) return false
  return totp.check(token, secret)
}

export const cookie2FAName = (userId: string) => 'id_token_2fa_' + userId

export type TwoFA = { active: boolean, secret: string, recovery?: Password }

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
