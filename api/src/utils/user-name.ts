import type { User } from '#types'

export default (user: Pick<User, 'email' | 'lastName' | 'firstName' | 'nhi'> & Partial<Pick<User, 'name'>>, ignoreExisting = true): string => {
  // NHIs have no firstName/lastName and their email is a synthetic address whose local
  // part is an opaque id, name is set explicitly by the caller
  if (user.nhi) return user.name ?? ''
  const lastName = user.lastName !== user.email ? user.lastName : ''
  if (user.firstName || lastName) return ((user.firstName || '') + ' ' + (lastName || '')).trim()
  // const oauthWithName = Object.keys(user.oauth || {}).find(p => !!user.oauth[p].name)
  // if (oauthWithName) return user.oauth[oauthWithName].name
  // email can be missing at runtime despite the schema (e.g. some LDAP-backed records);
  // fall back to any existing name rather than crashing on a missing local-part
  if (!user.email) return user.name ?? ''
  return (user.email.split('@').shift() as string).split('.').map(str => str[0].toUpperCase() + str.slice(1)).join(' ')
}
