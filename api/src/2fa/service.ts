import { authenticator } from 'otplib'
import { type Password } from '../utils/passwords.ts'

export const isValid = (secret: string, token: string) => {
  return authenticator.check(token, secret)
}

export const cookieName = (userId: string) => 'id_token_2fa_' + userId

export type TwoFA = { active: boolean, secret: string, recovery?: Password }
