import type { User } from '#types'

export default (user: Pick<User, 'email' | 'lastName' | 'firstName'>, ignoreExisting = true): string => {
  const lastName = user.lastName !== user.email ? user.lastName : ''
  if (user.firstName || lastName) return ((user.firstName || '') + ' ' + (lastName || '')).trim()
  // const oauthWithName = Object.keys(user.oauth || {}).find(p => !!user.oauth[p].name)
  // if (oauthWithName) return user.oauth[oauthWithName].name
  return (user.email.split('@').shift() as string).split('.').map(str => str[0].toUpperCase() + str.slice(1)).join(' ')
}
