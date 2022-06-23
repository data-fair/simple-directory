exports.description = 'Change user model to support multiple departments.'

exports.exec = async (db, debug) => {
  for await (const user of db.collection('users').find({ 'organizations.department': { $exists: true } })) {
    debug('work on user', user)
    for (const org of user.organizations.filter(o => o.department)) {
      console.log(org)
    }
  }
}
