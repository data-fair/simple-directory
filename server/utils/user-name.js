module.exports = (user) => {
  if (user.name) return user.name
  if (user.firstName || user.lastName) return ((user.firstName || '') + ' ' + (user.lastName || '')).trim()
  if (user.email) return user.email.split('@').shift().split('.').map(str => str[0].toUpperCase() + str.slice(1)).join(' ')
}
