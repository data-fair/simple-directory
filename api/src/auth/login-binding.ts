// Binds an SSO login (the oauth relay state stored server side) to the browser that started it:
// a random secret is set in a cookie named after the relay state and only its hash is stored.
// A callback URL replayed from another browser (login CSRF, session fixation) carries no such cookie.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { Request, Response } from 'express'
import Cookies from 'cookies'
import { reqSitePath } from '@data-fair/lib-express'
import config from '#config'

const secure = config.publicUrl.startsWith('https://')

const cookieName = (relayStateId: string) => `sd_login_${relayStateId}`
const cookiePath = (req: Request) => reqSitePath(req) + '/simple-directory/api/auth/'
const hashSecret = (secret: string) => createHash('sha256').update(secret).digest('base64url')

/**
 * Sets the binding cookie and returns the hash to store in the relay state.
 * sameSite is 'lax' for a login callback reached by a top level redirect, 'none' when the callback
 * can be a cross site POST (kept as a parameter, the oidc callback is a GET).
 */
export const setLoginBinding = (req: Request, res: Response, relayStateId: string, sameSite: 'lax' | 'none'): string => {
  const secret = randomBytes(32).toString('base64url')
  const cookies = new Cookies(req, res, { secure })
  cookies.set(cookieName(relayStateId), secret, {
    httpOnly: true,
    secure,
    sameSite,
    path: cookiePath(req),
    maxAge: 30 * 60 * 1000
  })
  return hashSecret(secret)
}

/** Compares the cookie with the stored hash in constant time and clears the cookie. */
export const checkLoginBinding = (req: Request, res: Response, relayStateId: string, hash: string): boolean => {
  const cookies = new Cookies(req, res, { secure })
  const secret = cookies.get(cookieName(relayStateId))
  cookies.set(cookieName(relayStateId), '', { path: cookiePath(req), expires: new Date(0), httpOnly: true })
  if (!secret || !hash) return false
  const actual = Buffer.from(hashSecret(secret))
  const expected = Buffer.from(hash)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
