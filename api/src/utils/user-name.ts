import type { User } from '#types'

export default (user: User, ignoreExisting = true) => {
  if (user.name && !ignoreExisting) return user.name
  const lastName = user.lastName !== user.email ? user.lastName : ''
  if (user.firstName || lastName) return ((user.firstName || '') + ' ' + (lastName || '')).trim()
  // const oauthWithName = Object.keys(user.oauth || {}).find(p => !!user.oauth[p].name)
  // if (oauthWithName) return user.oauth[oauthWithName].name
  if (user.email) return user.email.split('@').shift().split('.').map(str => str[0].toUpperCase() + str.slice(1)).join(' ')
}
