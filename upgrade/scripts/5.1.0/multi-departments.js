exports.description = 'Change user model to support multiple departments.'

exports.exec = async (db, debug) => {
  for await (const user of db.collection('users').find({ 'organizations.department': { $exists: true } })) {
    debug('work on user', user)
    for (const org of user.organizations) {
      if (org.department) {
        org.departments = [{ id: org.department, role: org.role }]
        delete org.role
      }
      delete org.department
    }
    await db.collection('users').replaceOne({ _id: user._id }, user)
  }
}
