import { getSiteByUrl, reqSite } from '#services'
import { type ShortenedInvitation, type Invitation } from '#types'
import { type Request } from 'express'
import Debug from 'debug'
import { httpError } from '@data-fair/lib-express'

const debug = Debug('invitations')

const mapping = [
  ['n', 'name'],
  ['e', 'email'],
  ['r', 'role'],
  ['d', 'department'],
  ['dn', 'departmentName'],
  ['rd', 'redirect']
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

  if (invitSite?.authMode === 'onlyBackOffice' || !invitSite?.authMode) {
    debug('invit site is in onlyBackOffice, ignore it in invitation process and redirect to it at the end')
    invitSite = undefined
  }

  if (invitSite?.authMode === 'onlyOtherSite' && invitSite.authOnlyOtherSite) {
    // invite on the site that serves as auth source
    invitSite = await getSiteByUrl('https://' + invitSite.authOnlyOtherSite)
    debug('invit site in in onlyOtherSite mode, replace it with target site in invitation process and redirect to it at then end', invitSite)
    if (invitSite?.authMode === 'onlyBackOffice' || !invitSite?.authMode) {
      debug('rebound invit site is in onlyBackOffice, ignore it in invitation process')
      invitSite = undefined
    }
    if (invitSite?.authMode === 'onlyOtherSite' && invitSite.authOnlyOtherSite) {
      throw httpError(400, `Impossible d'utiliser le site ${invitSite.host} comme référence pour l'authentification, il est lui aussi configuré comme "uniquement sur un autre de vos sites".`)
    }
  }
  return invitSite
}
