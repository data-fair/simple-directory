module.exports = (user, ignoreExisting) => {
  if (user.name && !ignoreExisting) return user.name
  if (user.firstName || user.lastName) return ((user.firstName || '') + ' ' + (user.lastName || '')).trim()
  if (user.email) return user.email.split('@').shift().split('.').map(str => str[0].toUpperCase() + str.slice(1)).join(' ')
}
