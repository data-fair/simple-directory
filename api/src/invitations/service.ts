import { type ShortenedInvitation, type Invitation } from '#types'

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
