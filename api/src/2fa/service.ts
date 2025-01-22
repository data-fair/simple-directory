import { type Request } from 'express'
import { authenticator } from 'otplib'
import { type Password } from '../utils/passwords.ts'
import { session } from '@data-fair/lib-express'

export const is2FAValid = (secret: string | undefined, token: string) => {
  if (!secret) return false
  return authenticator.check(token, secret)
}

export const cookie2FAName = (userId: string) => 'id_token_2fa_' + userId

export type TwoFA = { active: boolean, secret: string, recovery?: Password }

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
