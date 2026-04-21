import { getSiteByUrl, reqSite, resolveAccountMainSite } from '#services'
import { type ShortenedInvitation, type Invitation } from '#types'
import { type Request } from 'express'
import Debug from 'debug'

const debug = Debug('invitations')

const mapping = [
  ['n', 'name'],
  ['e', 'email'],
  ['r', 'role'],
  ['d', 'department'],
  ['rd', 'redirect'],
  ['ds', 'departments']
]

// prepare a smaller version of the invitation object to minimize token size
export const shortenInvit = (invit: Invitation) => {
  const shortInvit: any = { ...invit }
  Object.entries(invit).forEach(([key, value]) => {
    if (value === null) delete shortInvit[key]
  })
  for (const [shortKey, longKey] of mapping) {
    if (longKey in shortInvit) {
      shortInvit[shortKey] = shortInvit[longKey]
      delete shortInvit[longKey]
    }
  }
  return shortInvit as ShortenedInvitation
}

export const unshortenInvit = (shortInvit: ShortenedInvitation) => {
  const invit: any = { ...shortInvit }
  for (const [shortKey, longKey] of mapping) {
    if (shortKey in invit) {
      invit[longKey] = invit[shortKey]
      delete invit[shortKey]
    }
  }
  return invit as Invitation
}

export const getInvitSite = async (req: Request, redirect?: string) => {
  let invitSite = await reqSite(req)
  if (redirect) {
    invitSite = (await getSiteByUrl(redirect)) ?? undefined
    debug('site referenced in invitation', redirect, invitSite)
  }
  const resolved = await resolveAccountMainSite(invitSite)
  debug('invit site resolved to account-main', resolved)
  return resolved
}
