const mapping = [
  ['n', 'name'],
  ['e', 'email'],
  ['r', 'role'],
  ['d', 'department']
]

// prepare a smaller version of the invitation object to minimize token size
export const  shortenInvit = (invit) => {
  const shortInvit = { ...invit }
  Object.keys(invit).forEach(key => {
    if (invit[key] === null) delete shortInvit[key]
  })
  for (const [shortKey, longKey] of mapping) {
    if (longKey in shortInvit) {
      shortInvit[shortKey] = shortInvit[longKey]
      delete shortInvit[longKey]
    }
  }
  return shortInvit
}

export const  unshortenInvit = (shortInvit) => {
  const invit = { ...shortInvit }
  for (const [shortKey, longKey] of mapping) {
    if (shortKey in invit) {
      invit[longKey] = invit[shortKey]
      delete invit[shortKey]
    }
  }
  return invit
}
